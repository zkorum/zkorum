import { randomUUID } from "node:crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Script } from "@valkey/valkey-glide";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import {
    analysisSnapshotOpinionTable,
    conversationContentTable,
    conversationTable,
    conversationViewSnapshotTable,
    opinionContentTable,
    opinionTable,
    organizationMembershipAllProjectCapabilityTable,
    organizationMembershipTable,
    organizationTable,
    polisConversationConfigTable,
    projectOrganizationOwnershipTable,
    projectTable,
    userTable,
    voteContentTable,
    voteTable,
} from "../src/shared-backend/schema.js";
import { getOpinionManagementCapabilities } from "../src/service/opinionPermissions.js";
import { editOpinion } from "../src/service/opinionEdit.js";
import { deleteOpinionBySlugId } from "../src/service/comment.js";
import type { VoteBuffer } from "../src/service/voteBuffer.js";
import { readDbFixtureSql } from "./dbFixture.js";

vi.mock("../src/shared-backend/conversationCounters.js", async () => ({
    ...(await vi.importActual("../src/shared-backend/conversationCounters.js")),
    scheduleConversationAnalysisRefresh: vi.fn(),
}));
vi.mock("../src/service/conversationViewSnapshot.js", async () => ({
    ...(await vi.importActual("../src/service/conversationViewSnapshot.js")),
    createConversationViewSnapshotsFromCurrentState: vi.fn(),
}));
vi.mock("../src/service/contentLanguageMetadata.js", async () => ({
    ...(await vi.importActual("../src/service/contentLanguageMetadata.js")),
    resolveContentLanguageMetadata: vi.fn(async () => ({
        sourceLanguageCode: null,
        sourceRawLanguageCode: null,
        sourceLanguageProvider: null,
        sourceLanguageConfidence: null,
    })),
}));
vi.mock("../src/service/conversationMultilingual.js", () => ({
    getConversationMultilingualSetting: vi.fn(async () => ({
        dynamicTranslationEnabled: false,
    })),
}));
vi.mock("../src/service/contentTranslation.js", async () => ({
    ...(await vi.importActual("../src/service/contentTranslation.js")),
    createEagerContentTranslationWorkForConversation: vi.fn(async () => []),
}));

process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";
const authorId = "00000000-0000-4000-8000-000000000001";
const editorId = "00000000-0000-4000-8000-000000000002";
const voterId = "00000000-0000-4000-8000-000000000003";
const blockingVotes = vi.fn(async () => false);
const voteBuffer: VoteBuffer = {
    add: async () => {},
    flush: async () => {},
    shutdown: async () => {},
    getBufferSize: () => 0,
    hasBlockingVotes: blockingVotes,
};
const translationQueueScript = new Script("return 0");
function first<T>(rows: T[]): T {
    const row = rows.at(0);
    if (row === undefined) throw new Error("Missing test fixture row");
    return row;
}

describe("statement editing and seed deletion", () => {
    let container: StartedTestContainer;
    let client: postgres.Sql;
    let db: PostgresJsDatabase;
    let conversationId: number;
    let conversationContentId: number;

    beforeAll(async () => {
        container = await new GenericContainer("postgres:16-alpine")
            .withEnvironment({
                POSTGRES_USER: "postgres",
                POSTGRES_PASSWORD: "postgres",
                POSTGRES_DB: "agora_test",
            })
            .withExposedPorts(5432)
            .start();
        client = postgres({
            host: container.getHost(),
            port: container.getMappedPort(5432),
            username: "postgres",
            password: "postgres",
            database: "agora_test",
        });
        db = drizzle(client);
        await db.execute(
            sql.raw(readDbFixtureSql("conversation-seed-opinions.sql")),
        );
    }, 120_000);
    afterAll(async () => {
        translationQueueScript.release();
        await client?.end({ timeout: 5 });
        await container?.stop();
    }, 120_000);
    beforeEach(async () => {
        blockingVotes.mockReset().mockResolvedValue(false);
        await db.execute(
            sql`TRUNCATE TABLE "user", project, organization, conversation, conversation_content, opinion, opinion_content, vote, vote_content, analysis_snapshot_opinion, organization_membership, organization_membership_all_project_capability, project_organization_ownership, realtime_event_outbox CASCADE`,
        );
        await db.insert(userTable).values([
            {
                id: authorId,
                username: "statement-author",
                totalOpinionCount: 1,
            },
            { id: editorId, username: "seed-editor", totalOpinionCount: 7 },
            { id: voterId, username: "voter" },
        ]);
        const organization = first(
            await db
                .insert(organizationTable)
                .values({
                    slug: "opinion-org",
                    displayName: "Opinion organization",
                    defaultLanguageCode: "en",
                    isFullImagePath: false,
                    directoryVisibility: "listed",
                })
                .returning(),
        );
        const membership = first(
            await db
                .insert(organizationMembershipTable)
                .values({ organizationId: organization.id, userId: editorId })
                .returning(),
        );
        await db
            .insert(organizationMembershipAllProjectCapabilityTable)
            .values({
                organizationMembershipId: membership.id,
                capability: "conversation_edit",
                grantedByUserId: authorId,
            });
        const project = first(
            await db
                .insert(projectTable)
                .values({
                    slug: "opinion-project",
                    title: "Opinion project",
                    directoryVisibility: "listed",
                })
                .returning(),
        );
        await db
            .insert(projectOrganizationOwnershipTable)
            .values({ projectId: project.id, organizationId: organization.id });
        const config = first(
            await db
                .insert(polisConversationConfigTable)
                .values({})
                .returning(),
        );
        const conversation = first(
            await db
                .insert(conversationTable)
                .values({
                    slugId: "editconv",
                    projectId: project.id,
                    polisConfigId: config.id,
                })
                .returning(),
        );
        conversationId = conversation.id;
        const content = first(
            await db
                .insert(conversationContentTable)
                .values({ conversationId, title: "Editing test" })
                .returning(),
        );
        conversationContentId = content.id;
        await db
            .update(conversationTable)
            .set({ currentContentId: content.id })
            .where(eq(conversationTable.id, conversationId));
        await db.insert(conversationViewSnapshotTable).values({
            conversationId,
            conversationContentId,
            opinionGroupSpecId: 1,
            viewReason: "conversation_content_updated",
            isClosed: false,
            opinionCount: 0,
            voteCount: 0,
            participantCount: 0,
            totalOpinionCount: 0,
            totalVoteCount: 0,
            totalParticipantCount: 0,
            moderatedOpinionCount: 0,
            hiddenOpinionCount: 0,
            activatedAt: new Date(),
        });
    });

    async function statement(isSeed = false) {
        const opinion = first(
            await db
                .insert(opinionTable)
                .values({
                    slugId: randomUUID().slice(0, 8),
                    authorId,
                    conversationId,
                    isSeed,
                })
                .returning(),
        );
        const content = first(
            await db
                .insert(opinionContentTable)
                .values({
                    opinionId: opinion.id,
                    conversationContentId,
                    content: "<p>Original statement</p>",
                    contentPlainText: "Original statement",
                })
                .returning(),
        );
        await db
            .update(opinionTable)
            .set({ currentContentId: content.id })
            .where(eq(opinionTable.id, opinion.id));
        return { opinion, content };
    }
    async function vote({
        opinionId,
        contentId,
        userId,
        option = "agree",
    }: {
        opinionId: number;
        contentId: number;
        userId: string;
        option?: "agree" | "disagree" | "pass";
    }) {
        const row = first(
            await db
                .insert(voteTable)
                .values({ opinionId, authorId: userId })
                .returning(),
        );
        const content = first(
            await db
                .insert(voteContentTable)
                .values({
                    voteId: row.id,
                    opinionContentId: contentId,
                    vote: option,
                })
                .returning(),
        );
        await db
            .update(voteTable)
            .set({ currentContentId: content.id })
            .where(eq(voteTable.id, row.id));
        return row;
    }
    async function save({
        slugId,
        sourceVersion,
        userId = authorId,
        body = "<p>Updated statement</p>",
    }: {
        slugId: string;
        sourceVersion: string;
        userId?: string;
        body?: string;
    }) {
        return await editOpinion({
            db,
            request: {
                opinionSlugId: slugId,
                sourceVersion,
                opinionBody: body,
            },
            userId,
            voteBuffer,
            googleCloudCredentials: undefined,
            valkey: undefined,
            translationQueueScript,
            displayLanguage: "en",
            spokenLanguages: ["en"],
        });
    }

    it("preserves the published version, checkpoint reference, author, and self-vote", async () => {
        const { opinion, content } = await statement();
        const selfVote = await vote({
            opinionId: opinion.id,
            contentId: content.id,
            userId: authorId,
        });
        await db.insert(analysisSnapshotOpinionTable).values({
            analysisSnapshotId: 1,
            opinionId: opinion.id,
            opinionContentId: content.id,
            localOpinionIndex: 0,
        });
        const result = await save({
            slugId: opinion.slugId,
            sourceVersion: content.publicId,
        });
        expect(result).toMatchObject({
            success: true,
            displayedOpinionItem: {
                isEdited: true,
                username: "statement-author",
            },
        });
        const current = first(
            await db
                .select()
                .from(opinionTable)
                .where(eq(opinionTable.id, opinion.id)),
        );
        expect(current.currentContentId).not.toBe(content.id);
        expect(current.authorId).toBe(authorId);
        expect(current.createdAt).toEqual(opinion.createdAt);
        const historical = first(
            await db
                .select({
                    wording: opinionContentTable.content,
                    isEdited: opinionContentTable.isEdited,
                })
                .from(analysisSnapshotOpinionTable)
                .innerJoin(
                    opinionContentTable,
                    eq(
                        opinionContentTable.id,
                        analysisSnapshotOpinionTable.opinionContentId,
                    ),
                ),
        );
        expect(historical).toEqual({
            wording: "<p>Original statement</p>",
            isEdited: false,
        });
        expect(
            first(
                await db
                    .select()
                    .from(voteTable)
                    .where(eq(voteTable.id, selfVote.id)),
            ).currentContentId,
        ).not.toBeNull();
        expect(
            first(await db.select({ count: count() }).from(voteContentTable))
                .count,
        ).toBe(1);
    });

    it.each(["agree", "disagree", "pass"] satisfies readonly (
        | "agree"
        | "disagree"
        | "pass"
    )[])("blocks another user's %s until it is cancelled", async (option) => {
        const { opinion, content } = await statement();
        const outsideVote = await vote({
            opinionId: opinion.id,
            contentId: content.id,
            userId: voterId,
            option,
        });
        expect(
            await save({
                slugId: opinion.slugId,
                sourceVersion: content.publicId,
            }),
        ).toEqual({ success: false, reason: "has_votes" });
        await db
            .update(voteTable)
            .set({ currentContentId: null })
            .where(eq(voteTable.id, outsideVote.id));
        expect(
            (
                await save({
                    slugId: opinion.slugId,
                    sourceVersion: content.publicId,
                })
            ).success,
        ).toBe(true);
        expect(
            first(await db.select({ count: count() }).from(voteContentTable))
                .count,
        ).toBe(1);
    });

    it("allows a collaborator to edit a seed but not another user's regular statement", async () => {
        const seed = await statement(true);
        expect(
            (
                await save({
                    slugId: seed.opinion.slugId,
                    sourceVersion: seed.content.publicId,
                    userId: editorId,
                })
            ).success,
        ).toBe(true);
        const revision = first(
            await db
                .select()
                .from(opinionContentTable)
                .where(
                    and(
                        eq(opinionContentTable.opinionId, seed.opinion.id),
                        eq(opinionContentTable.isEdited, true),
                    ),
                ),
        );
        expect(revision.editedByUserId).toBe(editorId);
        const regular = await statement();
        expect(
            await save({
                slugId: regular.opinion.slugId,
                sourceVersion: regular.content.publicId,
                userId: editorId,
            }),
        ).toEqual({ success: false, reason: "not_allowed" });
    });

    it("blocks seed edits for any vote, including the creator's vote", async () => {
        const { opinion, content } = await statement(true);
        await vote({
            opinionId: opinion.id,
            contentId: content.id,
            userId: authorId,
        });
        expect(
            await save({
                slugId: opinion.slugId,
                sourceVersion: content.publicId,
                userId: editorId,
            }),
        ).toEqual({ success: false, reason: "has_votes" });
    });

    it("refuses pending votes, unchanged versions, and concurrent overwrites correctly", async () => {
        const { opinion, content } = await statement();
        expect(
            (
                await save({
                    slugId: opinion.slugId,
                    sourceVersion: content.publicId,
                    body: content.content,
                })
            ).success,
        ).toBe(true);
        expect(
            first(await db.select({ count: count() }).from(opinionContentTable))
                .count,
        ).toBe(1);
        blockingVotes.mockResolvedValue(true);
        expect(
            await save({
                slugId: opinion.slugId,
                sourceVersion: content.publicId,
            }),
        ).toEqual({ success: false, reason: "has_votes" });
        blockingVotes.mockResolvedValue(false);
        const results = await Promise.all([
            save({ slugId: opinion.slugId, sourceVersion: content.publicId }),
            save({
                slugId: opinion.slugId,
                sourceVersion: content.publicId,
                body: "<p>Another update</p>",
            }),
        ]);
        expect(results.filter((result) => result.success)).toHaveLength(1);
        expect(results.find((result) => !result.success)).toEqual({
            success: false,
            reason: "version_conflict",
        });
    });

    it("lets conversation editors delete voted seeds and decrements the creator's count", async () => {
        const { opinion, content } = await statement(true);
        await vote({
            opinionId: opinion.id,
            contentId: content.id,
            userId: voterId,
        });
        expect(
            (
                await getOpinionManagementCapabilities({
                    db,
                    opinionSlugIds: [opinion.slugId],
                    userId: editorId,
                })
            ).get(opinion.slugId),
        ).toEqual({ canEdit: false, canDelete: true });
        await deleteOpinionBySlugId({
            db,
            opinionSlugId: opinion.slugId,
            userId: editorId,
        });
        expect(
            first(
                await db
                    .select()
                    .from(opinionTable)
                    .where(eq(opinionTable.id, opinion.id)),
            ).currentContentId,
        ).toBeNull();
        expect(
            first(
                await db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.id, authorId)),
            ).totalOpinionCount,
        ).toBe(0);
        expect(
            first(
                await db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.id, editorId)),
            ).totalOpinionCount,
        ).toBe(7);
        expect(
            first(await db.select({ count: count() }).from(opinionContentTable))
                .count,
        ).toBe(1);
    });

    it("rolls back staged content and events when a vote arrives before commit", async () => {
        const { opinion, content } = await statement();
        blockingVotes
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true);
        expect(
            await save({
                slugId: opinion.slugId,
                sourceVersion: content.publicId,
            }),
        ).toEqual({ success: false, reason: "has_votes" });
        expect(
            first(
                await db
                    .select()
                    .from(opinionTable)
                    .where(eq(opinionTable.id, opinion.id)),
            ).currentContentId,
        ).toBe(content.id);
        expect(
            first(
                await db
                    .select({ count: count() })
                    .from(opinionContentTable)
                    .where(eq(opinionContentTable.opinionId, opinion.id)),
            ).count,
        ).toBe(1);
    });

    it("does not authorize seed deletion just because the user is its original author", async () => {
        const { opinion } = await statement(true);
        await expect(
            deleteOpinionBySlugId({
                db,
                opinionSlugId: opinion.slugId,
                userId: authorId,
            }),
        ).rejects.toThrow("Missing statement deletion permission");
    });
});
