import { readFileSync } from "node:fs";
import { and, eq, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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

vi.mock("@/app.js", () => ({
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/service/contentTranslation.js", () => ({
    createEagerContentTranslationWorkForKnownConversation: async () => [],
    fetchCurrentSurveyQuestionSources: async () => [],
    fetchSeedOpinionSources: async () => [],
}));

import { Dto } from "../src/shared/types/dto.js";
import {
    conversationContentTable,
    conversationEmailUpdateConversationTable,
    conversationEmailUpdateTable,
    conversationEmailUpdateDeliveryTable,
    conversationModerationTable,
    conversationProjectAssignmentTable,
    conversationTable,
    organizationMembershipAllProjectCapabilityTable,
    organizationMembershipTable,
    organizationTable,
    polisConversationConfigTable,
    projectContentTable,
    projectOrganizationOwnershipTable,
    projectTable,
    projectTranslationTargetLanguageTable,
    conversationTranslationTargetLanguageTable,
    realtimeEventOutboxTable,
    userTable,
    premiumFeatureEntitlementTable,
} from "../src/shared-backend/schema.js";
import { getConversationProjectOptions } from "../src/service/conversationProject.js";
import { updateConversation } from "../src/service/postEdit.js";
import { readDbFixtureSql } from "./dbFixture.js";

process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";
const userId = "00000000-0000-4000-8000-000000000001";

describe("conversation project editing", () => {
    let container: StartedTestContainer;
    let client: postgres.Sql;
    let db: PostgresJsDatabase;
    let conversationId: number;
    let sourceProjectId: number;
    let destinationProjectId: number;
    let membershipId: number;

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
            database: "agora_test",
            username: "postgres",
            password: "postgres",
            max: 8,
        });
        db = drizzle(client);
        await db.execute(
            sql.raw(readDbFixtureSql("conversation-project-edit.sql")),
        );
        await db.execute(
            sql.raw(
                readFileSync(
                    new URL(
                        "../database/flyway/V0100__strange_wildside.sql",
                        import.meta.url,
                    ),
                    "utf8",
                ),
            ),
        );
        await db.execute(
            sql.raw(
                readFileSync(
                    new URL(
                        "../database/flyway/V0100.1__record_conversation_project_assignments.sql",
                        import.meta.url,
                    ),
                    "utf8",
                ),
            ),
        );
        const scopeConstraint = readFileSync(
            new URL(
                "../drizzle/0101_special_lady_deathstrike.sql",
                import.meta.url,
            ),
            "utf8",
        )
            .split("--> statement-breakpoint")
            .find((statement) =>
                statement.includes(
                    'ADD CONSTRAINT "email_update_scope_conversation_project_fk"',
                ),
            );
        if (scopeConstraint === undefined)
            throw new Error("Missing generated assignment foreign key");
        await db.execute(sql.raw(scopeConstraint));
    }, 120_000);

    afterAll(async () => {
        await client?.end({ timeout: 5 });
        await container?.stop();
    }, 120_000);

    beforeEach(async () => {
        await db.execute(
            sql`TRUNCATE conversation_project_assignment, conversation_email_update_conversation, conversation_email_update_delivery, conversation_email_update, conversation_content, conversation_moderation, conversation_translation_target_language, conversation, polis_conversation_config, project_content, project_translation_target_language, project_organization_ownership, project, premium_feature_entitlement, organization_membership_all_project_capability, organization_membership, organization, "user", realtime_event_outbox_topic, realtime_event_outbox RESTART IDENTITY CASCADE`,
        );
        await db
            .insert(userTable)
            .values({ id: userId, username: "facilitator" });
        const [organization] = await db
            .insert(organizationTable)
            .values({
                slug: "owner",
                displayName: "Owner",
                defaultLanguageCode: "en",
                directoryVisibility: "listed",
                isFullImagePath: false,
            })
            .returning({ id: organizationTable.id });
        if (organization === undefined)
            throw new Error("Missing organization fixture");
        const [membership] = await db
            .insert(organizationMembershipTable)
            .values({ organizationId: organization.id, userId })
            .returning({ id: organizationMembershipTable.id });
        if (membership === undefined)
            throw new Error("Missing membership fixture");
        membershipId = membership.id;
        await db
            .insert(organizationMembershipAllProjectCapabilityTable)
            .values([
                {
                    organizationMembershipId: membershipId,
                    capability: "conversation_create",
                },
                {
                    organizationMembershipId: membershipId,
                    capability: "conversation_edit",
                },
            ]);
        const [source, destination] = await db
            .insert(projectTable)
            .values([
                {
                    slug: "source",
                    title: "Source",
                    directoryVisibility: "listed",
                },
                {
                    slug: "destination",
                    title: "Destination",
                    directoryVisibility: "listed",
                },
            ])
            .returning({ id: projectTable.id, title: projectTable.title });
        if (source === undefined || destination === undefined)
            throw new Error("Missing project fixtures");
        sourceProjectId = source.id;
        destinationProjectId = destination.id;
        await db.insert(projectOrganizationOwnershipTable).values([
            { organizationId: organization.id, projectId: source.id },
            { organizationId: organization.id, projectId: destination.id },
        ]);
        for (const project of [source, destination]) {
            const [content] = await db
                .insert(projectContentTable)
                .values({ projectId: project.id, title: project.title })
                .returning({ id: projectContentTable.id });
            if (content === undefined)
                throw new Error("Missing project content fixture");
            await db
                .update(projectTable)
                .set({ currentContentId: content.id })
                .where(eq(projectTable.id, project.id));
        }
        const [config] = await db
            .insert(polisConversationConfigTable)
            .values({})
            .returning({ id: polisConversationConfigTable.id });
        if (config === undefined)
            throw new Error("Missing configuration fixture");
        const [conversation] = await db
            .insert(conversationTable)
            .values({
                slugId: "conv1234",
                projectId: source.id,
                polisConfigId: config.id,
            })
            .returning({ id: conversationTable.id });
        if (conversation === undefined)
            throw new Error("Missing conversation fixture");
        conversationId = conversation.id;
        const [content] = await db
            .insert(conversationContentTable)
            .values({ conversationId, title: "Conversation" })
            .returning({ id: conversationContentTable.id });
        if (content === undefined) throw new Error("Missing content fixture");
        await db
            .update(conversationTable)
            .set({ currentContentId: content.id })
            .where(eq(conversationTable.id, conversationId));
    });

    function request() {
        return Dto.updateConversationRequest.parse({
            conversationSlugId: "conv1234",
            conversationTitle: "Conversation",
            isIndexed: true,
            participationMode: "account_required",
            multilingualSetting: {
                additionalLanguageCodes: [],
                dynamicTranslationEnabled: false,
            },
            conversationTypeConfig: {
                conversationType: "polis",
                votingPresentation: "list",
            },
            projectChange: {
                expectedProjectSlug: "source",
                target: { kind: "project", projectSlug: "destination" },
            },
        });
    }

    it("moves atomically and publishes the committed assignment", async () => {
        const response = await updateConversation({
            db,
            userId,
            data: request(),
        });
        expect(response).toMatchObject({
            success: true,
            projectAssignment: {
                previousProjectSlug: "source",
                projectSlug: "destination",
            },
        });
        expect(
            (
                await db
                    .select()
                    .from(conversationTable)
                    .where(eq(conversationTable.id, conversationId))
            ).at(0)?.projectId,
        ).toBe(destinationProjectId);
        expect(
            await db.select().from(conversationProjectAssignmentTable),
        ).toHaveLength(2);
        expect(
            (await db.select().from(realtimeEventOutboxTable)).at(0)?.eventType,
        ).toBe("conversation_settings_updated");
    });

    it("rejects a stale assignment without applying other edits", async () => {
        const data = request();
        data.projectChange = {
            expectedProjectSlug: "stale",
            target: { kind: "project", projectSlug: "destination" },
        };
        data.conversationTitle = "Changed";
        expect(
            await updateConversation({
                db,
                userId,
                data,
            }),
        ).toMatchObject({
            success: false,
            reason: "project_assignment_changed",
        });
        expect(await db.select().from(conversationContentTable)).toHaveLength(
            1,
        );
        expect(await db.select().from(realtimeEventOutboxTable)).toHaveLength(
            0,
        );
    });

    it("serializes concurrent moves so a stale save cannot win", async () => {
        const results = await Promise.all([
            updateConversation({
                db,
                userId,
                data: request(),
            }),
            updateConversation({
                db,
                userId,
                data: request(),
            }),
        ]);
        expect(results.filter((result) => result.success)).toHaveLength(1);
        expect(results.filter((result) => !result.success)).toEqual([
            { success: false, reason: "project_assignment_changed" },
        ]);
    });

    it("rejects a deleted destination", async () => {
        await db
            .update(projectTable)
            .set({ deletedAt: new Date() })
            .where(eq(projectTable.id, destinationProjectId));
        expect(
            await updateConversation({
                db,
                userId,
                data: request(),
            }),
        ).toMatchObject({ success: false, reason: "project_not_available" });
    });

    it("rejects moving a locked conversation", async () => {
        await db.insert(conversationModerationTable).values({
            conversationId,
            authorId: userId,
            moderationAction: "lock",
            moderationReason: "spam",
        });
        expect(
            await updateConversation({
                db,
                userId,
                data: request(),
            }),
        ).toMatchObject({ success: false, reason: "conversation_locked" });
    });

    it.each(["source", "destination"])(
        "rejects a move during an active %s delivery",
        async (scope) => {
            await db.insert(conversationEmailUpdateDeliveryTable).values({
                projectId:
                    scope === "source" ? sourceProjectId : destinationProjectId,
                updateId: 1,
                acceptedTestAttemptId: 1,
                acceptedByUserId: userId,
                status: "preparing",
                participantPreferenceScope: "project",
                audienceCutoffAt: new Date(),
                displayedParticipantEstimate: 1,
                acceptanceParticipantEstimate: 1,
                requiredOwnerCopyCount: 1,
                acceptedAt: new Date(),
            });
            expect(
                await updateConversation({
                    db,
                    userId,
                    data: request(),
                }),
            ).toMatchObject({
                success: false,
                reason: "active_delivery_conflict",
            });
        },
    );

    it("requires destination creation permission even when the source is editable", async () => {
        await db
            .update(organizationMembershipAllProjectCapabilityTable)
            .set({ deletedAt: new Date(), revokedByUserId: userId })
            .where(
                and(
                    eq(
                        organizationMembershipAllProjectCapabilityTable.organizationMembershipId,
                        membershipId,
                    ),
                    eq(
                        organizationMembershipAllProjectCapabilityTable.capability,
                        "conversation_create",
                    ),
                ),
            );
        expect(
            await updateConversation({
                db,
                userId,
                data: request(),
            }),
        ).toMatchObject({
            success: false,
            reason: "missing_project_capability",
        });
    });

    it("keeps the assignment when a survey/details save omits a move", async () => {
        const data = request();
        data.projectChange = undefined;
        expect(
            await updateConversation({
                db,
                userId,
                data,
            }),
        ).toMatchObject({ success: true });
        expect(
            (await db.select().from(conversationTable)).at(0)?.projectId,
        ).toBe(sourceProjectId);
        expect(
            await db.select().from(conversationProjectAssignmentTable),
        ).toHaveLength(1);
    });

    it("offers authorized destinations and an explicit organization No Project scope", async () => {
        const options = await getConversationProjectOptions({ db, userId });
        expect(options.map((option) => option.target)).toEqual(
            expect.arrayContaining([
                { kind: "project", projectSlug: "destination" },
                { kind: "no_project", organizationSlug: "owner" },
            ]),
        );
    });

    it("derives Email Update permissions through any owner rather than the displayed organization", async () => {
        const [owner] = await db
            .insert(organizationTable)
            .values({
                slug: "email-owner",
                displayName: "Email owner",
                defaultLanguageCode: "en",
                directoryVisibility: "listed",
                isFullImagePath: false,
            })
            .returning({ id: organizationTable.id });
        if (owner === undefined)
            throw new Error("Missing additional owner fixture");
        const [membership] = await db
            .insert(organizationMembershipTable)
            .values({ organizationId: owner.id, userId })
            .returning({ id: organizationMembershipTable.id });
        if (membership === undefined)
            throw new Error("Missing additional membership fixture");
        await db
            .insert(projectOrganizationOwnershipTable)
            .values({
                projectId: destinationProjectId,
                organizationId: owner.id,
            });
        await db
            .insert(organizationMembershipAllProjectCapabilityTable)
            .values([
                {
                    organizationMembershipId: membership.id,
                    capability: "conversation_edit",
                },
                {
                    organizationMembershipId: membership.id,
                    capability: "conversation_email_update",
                },
            ]);
        await db
            .insert(premiumFeatureEntitlementTable)
            .values({
                organizationId: owner.id,
                feature: "conversation_email_update",
                startsAt: new Date(Date.now() - 60_000),
            });
        const options = await getConversationProjectOptions({ db, userId });
        expect(
            options.find(
                (option) =>
                    option.target.kind === "project" &&
                    option.target.projectSlug === "destination",
            )?.emailUpdates.canConfigure,
        ).toBe(true);
    });

    it("resolves No Project to the selected organization's default", async () => {
        const data = request();
        data.projectChange = {
            expectedProjectSlug: "source",
            target: { kind: "no_project", organizationSlug: "owner" },
        };
        const response = await updateConversation({
            db,
            userId,
            data,
        });
        expect(response).toMatchObject({
            success: true,
            projectAssignment: {
                target: { kind: "no_project", organizationSlug: "owner" },
            },
        });
    });

    it("uses destination inherited languages and rejects unavailable entitlements", async () => {
        await db
            .insert(projectTranslationTargetLanguageTable)
            .values({ projectId: destinationProjectId, languageCode: "fr" });
        const data = request();
        data.languageSettingsSource = "project_inherited";
        expect(
            await updateConversation({
                db,
                userId,
                data,
            }),
        ).toMatchObject({ success: false, reason: "premium_access_required" });
        expect(
            (await db.select().from(conversationTable)).at(0)?.projectId,
        ).toBe(sourceProjectId);
    });
    it("validates the resulting language policy rather than the source project's old targets", async () => {
        await db
            .insert(conversationTranslationTargetLanguageTable)
            .values({ conversationId, languageCode: "fr" });
        expect(
            await updateConversation({
                db,
                userId,
                data: request(),
            }),
        ).toMatchObject({ success: true });
    });

    it("retains historical scope while enforcing current scope for new Email Updates", async () => {
        const [update] = await db
            .insert(conversationEmailUpdateTable)
            .values({
                projectId: sourceProjectId,
                scopeKind: "listed_project",
                createdByUserId: userId,
                authorizingOrganizationId: 1,
                authorizingPremiumFeatureId: 1,
                projectTitleSnapshot: "Source",
                replyToNameSnapshot: "Owner",
                replyToEmailSnapshot: "contact@example.com",
                subject: "Update",
                bodyHtml: "<p>Update</p>",
                bodyPlainText: "Update",
            })
            .returning({ id: conversationEmailUpdateTable.id });
        if (update === undefined)
            throw new Error("Missing Email Update fixture");
        const snapshot = {
            updateId: update.id,
            projectId: sourceProjectId,
            conversationId,
            conversationTitleSnapshot: "Conversation",
            conversationUrlSnapshot: "/project/source/conversation/conv1234/",
        };
        await db
            .insert(conversationEmailUpdateConversationTable)
            .values(snapshot);
        expect(
            await updateConversation({
                db,
                userId,
                data: request(),
            }),
        ).toMatchObject({ success: true });
        expect(
            (
                await db.select().from(conversationEmailUpdateConversationTable)
            ).at(0),
        ).toMatchObject(snapshot);
        await expect(
            db
                .insert(conversationEmailUpdateConversationTable)
                .values({ ...snapshot, updateId: update.id + 1 }),
        ).rejects.toThrow();
        await expect(
            db
                .insert(conversationProjectAssignmentTable)
                .values({ projectId: 999, conversationId }),
        ).rejects.toThrow();
        await expect(
            db
                .update(conversationProjectAssignmentTable)
                .set({ projectId: destinationProjectId })
                .where(
                    eq(
                        conversationProjectAssignmentTable.projectId,
                        sourceProjectId,
                    ),
                ),
        ).rejects.toThrow();
    });
});
