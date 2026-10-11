import { randomUUID } from "node:crypto";
import { count, eq, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
    conversationContentTable,
    conversationModerationTable,
    conversationTable,
    opinionContentTable,
    opinionTable,
    organizationMembershipAllProjectCapabilityTable,
    organizationMembershipTable,
    organizationTable,
    polisConversationConfigTable,
    projectOrganizationOwnershipTable,
    projectTable,
    rankingConversationConfigTable,
    rankingItemTable,
    userTable,
    voteContentTable,
    voteTable,
} from "../src/shared-backend/schema.js";
import {
    getConversationForEdit,
    updateConversation,
} from "../src/service/postEdit.js";
import { postNewOpinion } from "../src/service/comment.js";
import * as translations from "../src/service/contentTranslation.js";
import {
    Dto,
    type UpdateConversationRequest,
} from "../src/shared/types/dto.js";
import { validateSeedOpinionAdditions } from "../src/shared/utils/seedOpinions.js";
import { readDbFixtureSql } from "./dbFixture.js";

process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";
const OWNER = "00000000-0000-4000-8000-000000000001";
const STRANGER = "00000000-0000-4000-8000-000000000002";
const DID = "did:key:seed-editor-test";

function firstRow<T>(rows: T[]): T {
    const row = rows.at(0);
    if (row === undefined) throw new Error("Missing test fixture row");
    return row;
}

describe("seed-statement validation", () => {
    it("detects duplicates across formatting, case, and whitespace", () => {
        expect(
            validateSeedOpinionAdditions({
                opinions: [
                    "<p>Already <strong>HERE</strong></p>",
                    "New statement",
                    "<p>new   statement</p>",
                ],
                existingOpinions: ["<p>Already here</p>"],
            }),
        ).toEqual([0, 1, 2].map((index) => ({ index, reason: "duplicate" })));
    });
    it("rejects empty content after sanitization and accepts valid additions", () => {
        expect(
            validateSeedOpinionAdditions({
                opinions: ["<script>hidden</script>"],
                existingOpinions: [],
            }),
        ).toMatchObject([{ index: 0, reason: "plain_text_empty" }]);
        expect(
            validateSeedOpinionAdditions({
                opinions: ["<p>A new <strong>statement</strong></p>"],
                existingOpinions: ["An existing statement"],
            }),
        ).toEqual([]);
    });
    it("requires indexed errors for invalid seed statements", () => {
        expect(
            Dto.updateConversationResponse.parse({
                success: false,
                reason: "invalid_seed_opinion",
                seedOpinionFailure: { index: 0, reason: "duplicate" },
            }),
        ).toMatchObject({ reason: "invalid_seed_opinion" });
        expect(
            Dto.updateConversationResponse.safeParse({
                success: false,
                reason: "invalid_seed_opinion",
            }).success,
        ).toBe(false);
    });
});

describe("append-only conversation seed statements", () => {
    let container: StartedTestContainer;
    let client: postgres.Sql;
    let db: PostgresJsDatabase;
    let projectId: number;

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
            max: 8,
        });
        db = drizzle(client);
        await db.execute(
            sql.raw(readDbFixtureSql("conversation-seed-opinions.sql")),
        );
        await db.insert(userTable).values([
            { id: OWNER, username: "seed-editor" },
            { id: STRANGER, username: "stranger" },
        ]);
        const organization = firstRow(
            await db
                .insert(organizationTable)
                .values({
                    slug: "seed-organization",
                    displayName: "Seed organization",
                    defaultLanguageCode: "en",
                    isFullImagePath: false,
                    directoryVisibility: "listed",
                })
                .returning(),
        );
        const membership = firstRow(
            await db
                .insert(organizationMembershipTable)
                .values({ organizationId: organization.id, userId: OWNER })
                .returning(),
        );
        await db
            .insert(organizationMembershipAllProjectCapabilityTable)
            .values({
                organizationMembershipId: membership.id,
                capability: "conversation_edit",
                grantedByUserId: OWNER,
            });
        const project = firstRow(
            await db
                .insert(projectTable)
                .values({
                    slug: "seed-project",
                    title: "Seed project",
                    directoryVisibility: "listed",
                })
                .returning(),
        );
        projectId = project.id;
        await db
            .insert(projectOrganizationOwnershipTable)
            .values({ projectId, organizationId: organization.id });
    }, 120_000);

    afterAll(async () => {
        await client?.end({ timeout: 5 });
        await container?.stop();
    }, 120_000);

    async function createConversation({
        ranking = false,
        sourceManaged = false,
        closed = false,
    }: { ranking?: boolean; sourceManaged?: boolean; closed?: boolean } = {}) {
        const config = ranking
            ? firstRow(
                  await db
                      .insert(rankingConversationConfigTable)
                      .values({
                          rankingMode: "bws",
                          externalSourceConfig: sourceManaged
                              ? {
                                    sourceType: "github_issue",
                                    repository: "test/repository",
                                    label: "priority",
                                }
                              : null,
                      })
                      .returning(),
              )
            : firstRow(
                  await db
                      .insert(polisConversationConfigTable)
                      .values({})
                      .returning(),
              );
        const conversation = firstRow(
            await db
                .insert(conversationTable)
                .values({
                    slugId: randomUUID().slice(0, 8),
                    projectId,
                    conversationType: ranking ? "ranking" : "polis",
                    polisConfigId: ranking ? undefined : config.id,
                    rankingConfigId: ranking ? config.id : undefined,
                    isClosed: closed,
                })
                .returning(),
        );
        const content = firstRow(
            await db
                .insert(conversationContentTable)
                .values({
                    conversationId: conversation.id,
                    title: "Original title",
                    body: "<p>Original body</p>",
                    bodyPlainText: "Original body",
                })
                .returning(),
        );
        await db
            .update(conversationTable)
            .set({ currentContentId: content.id })
            .where(eq(conversationTable.id, conversation.id));
        const request = Dto.updateConversationRequest.parse({
            conversationSlugId: conversation.slugId,
            conversationTitle: content.title,
            conversationBody: content.body,
            isIndexed: conversation.isIndexed,
            participationMode: conversation.participationMode,
            multilingualSetting: {
                additionalLanguageCodes: [],
                dynamicTranslationEnabled: false,
            },
            conversationTypeConfig: ranking
                ? { conversationType: "ranking", rankingMode: "bws" }
                : { conversationType: "polis", votingPresentation: "list" },
        });
        return { conversation, content, config, request };
    }

    function save(request: UpdateConversationRequest) {
        return updateConversation({
            db,
            userId: OWNER,
            didWrite: DID,
            data: request,
        });
    }

    it("saves details without requiring new statements and rejects empty additions atomically", async () => {
        const { request, conversation } = await createConversation();
        expect(
            (await save({ ...request, conversationTitle: "Details only" }))
                .success,
        ).toBe(true);
        expect(
            await save({
                ...request,
                conversationTitle: "Invalid update",
                newSeedOpinionList: ["<p></p>"],
            }),
        ).toMatchObject({
            success: false,
            reason: "invalid_seed_opinion",
            seedOpinionFailure: { index: 0, reason: "plain_text_empty" },
        });
        const current = firstRow(
            await db
                .select({ title: conversationContentTable.title })
                .from(conversationTable)
                .innerJoin(
                    conversationContentTable,
                    eq(
                        conversationContentTable.id,
                        conversationTable.currentContentId,
                    ),
                )
                .where(eq(conversationTable.id, conversation.id)),
        );
        expect(current.title).toBe("Details only");
        expect(
            Dto.updateConversationRequest.safeParse({
                ...request,
                seedOpinions: [{ slugId: "oldseed1", content: "Changed" }],
            }).success,
        ).toBe(false);
    });

    it("appends new seeds without altering existing content or votes", async () => {
        const original = await createConversation();
        const oldSeed = await postNewOpinion({
            db,
            normalizedContent: {
                html: "<p>Existing seed</p>",
                plainText: "Existing seed",
            },
            conversationSlugId: original.conversation.slugId,
            didWrite: DID,
            userAgent: "test",
            now: new Date(),
            isSeed: true,
            conversationMetadata: {
                conversationId: original.conversation.id,
                conversationContentId: original.content.id,
                conversationAuthorId: OWNER,
                conversationIsIndexed: true,
                conversationParticipationMode: "account_required",
                conversationIsClosed: false,
                requiresEventTicket: null,
            },
        });
        if (!oldSeed.success) throw new Error("Failed to create fixture seed");
        const opinion = firstRow(
            await db
                .select()
                .from(opinionTable)
                .where(eq(opinionTable.slugId, oldSeed.opinionSlugId)),
        );
        if (opinion.currentContentId === null)
            throw new Error("Missing seed content");
        const vote = firstRow(
            await db
                .insert(voteTable)
                .values({ authorId: OWNER, opinionId: opinion.id })
                .returning(),
        );
        const voteContent = firstRow(
            await db
                .insert(voteContentTable)
                .values({
                    voteId: vote.id,
                    opinionContentId: opinion.currentContentId,
                    vote: "agree",
                })
                .returning(),
        );
        await db
            .update(voteTable)
            .set({ currentContentId: voteContent.id })
            .where(eq(voteTable.id, vote.id));

        const result = await save({
            ...original.request,
            newSeedOpinionList: ["<p>New <strong>seed</strong></p>"],
        });
        expect(result.success).toBe(true);
        expect(result.success && result.addedOpinions?.at(0)?.numAgrees).toBe(
            0,
        );
        expect(
            firstRow(
                await db
                    .select()
                    .from(opinionTable)
                    .where(eq(opinionTable.id, opinion.id)),
            ),
        ).toEqual(opinion);
        expect(
            firstRow(
                await db
                    .select()
                    .from(voteTable)
                    .where(eq(voteTable.id, vote.id)),
            ).currentContentId,
        ).toBe(voteContent.id);
        expect(
            firstRow(await db.select({ count: count() }).from(voteTable)).count,
        ).toBe(1);
        const edit = await getConversationForEdit({
            db,
            userId: OWNER,
            conversationSlugId: original.conversation.slugId,
        });
        expect(
            edit.success && edit.seedOpinions.map((seed) => seed.content),
        ).toEqual(["<p>Existing seed</p>", "<p>New <strong>seed</strong></p>"]);
        expect(
            firstRow(
                await db
                    .select()
                    .from(opinionContentTable)
                    .where(
                        eq(opinionContentTable.id, opinion.currentContentId),
                    ),
            ).content,
        ).toBe("<p>Existing seed</p>");
    });

    it("rejects duplicate concurrent saves without inserting twice", async () => {
        const { request, conversation } = await createConversation();
        const results = await Promise.all([
            save({ ...request, newSeedOpinionList: ["One seed"] }),
            save({ ...request, newSeedOpinionList: ["<p>ONE SEED</p>"] }),
        ]);
        expect(results.filter((result) => result.success)).toHaveLength(1);
        expect(results.find((result) => !result.success)).toMatchObject({
            reason: "invalid_seed_opinion",
            seedOpinionFailure: { index: 0, reason: "duplicate" },
        });
        expect(
            firstRow(
                await db
                    .select({ count: count() })
                    .from(opinionTable)
                    .where(eq(opinionTable.conversationId, conversation.id)),
            ).count,
        ).toBe(1);
    });

    it("rolls back details and every new statement when later work fails", async () => {
        const { request, conversation, content } = await createConversation();
        const translationFailure = vi
            .spyOn(
                translations,
                "createEagerContentTranslationWorkForKnownConversation",
            )
            .mockRejectedValueOnce(new Error("translation unavailable"));
        try {
            await expect(
                save({
                    ...request,
                    conversationTitle: "Changed title",
                    newSeedOpinionList: ["First seed", "Second seed"],
                }),
            ).rejects.toThrow("translation unavailable");
        } finally {
            translationFailure.mockRestore();
        }
        expect(
            firstRow(
                await db
                    .select()
                    .from(conversationTable)
                    .where(eq(conversationTable.id, conversation.id)),
            ).currentContentId,
        ).toBe(content.id);
        expect(
            firstRow(
                await db
                    .select({ count: count() })
                    .from(opinionTable)
                    .where(eq(opinionTable.conversationId, conversation.id)),
            ).count,
        ).toBe(0);
    });

    it("allows additions to closed conversations without reopening them", async () => {
        const { request, conversation } = await createConversation({
            closed: true,
        });
        expect(
            (
                await save({
                    ...request,
                    newSeedOpinionList: ["Prepared for later"],
                })
            ).success,
        ).toBe(true);
        expect(
            firstRow(
                await db
                    .select()
                    .from(conversationTable)
                    .where(eq(conversationTable.id, conversation.id)),
            ).isClosed,
        ).toBe(true);
    });

    it("enforces editor permissions and locking", async () => {
        const { request, conversation } = await createConversation();
        expect(
            await updateConversation({
                db,
                userId: STRANGER,
                didWrite: DID,
                data: { ...request, newSeedOpinionList: ["Unauthorized"] },
            }),
        ).toMatchObject({ success: false, reason: "not_author" });
        await db
            .insert(conversationModerationTable)
            .values({
                conversationId: conversation.id,
                authorId: OWNER,
                moderationAction: "lock",
                moderationReason: "spam",
            });
        expect(
            await save({ ...request, newSeedOpinionList: ["Locked"] }),
        ).toMatchObject({ success: false, reason: "conversation_locked" });
    });

    it("adds manual ranking seeds and preserves source-managed lists", async () => {
        const manual = await createConversation({ ranking: true });
        expect(
            (
                await save({
                    ...manual.request,
                    newSeedOpinionList: ["First item", "Second item"],
                })
            ).success,
        ).toBe(true);
        expect(
            firstRow(
                await db
                    .select()
                    .from(rankingConversationConfigTable)
                    .where(
                        eq(rankingConversationConfigTable.id, manual.config.id),
                    ),
            ).itemCount,
        ).toBe(2);
        expect(
            await db
                .select({ isSeed: rankingItemTable.isSeed })
                .from(rankingItemTable)
                .where(
                    eq(rankingItemTable.conversationId, manual.conversation.id),
                ),
        ).toEqual([{ isSeed: true }, { isSeed: true }]);
        const linked = await createConversation({
            ranking: true,
            sourceManaged: true,
        });
        expect(
            await save({
                ...linked.request,
                newSeedOpinionList: ["Manual item"],
            }),
        ).toMatchObject({
            success: false,
            reason: "seed_opinions_not_allowed",
        });
    });
});
