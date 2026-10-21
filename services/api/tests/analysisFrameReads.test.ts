import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { withReplicas } from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchAnalysisFrameGroupLabelsByFrameKey } from "../src/service/comment.js";
import * as schema from "../src/shared-backend/schema.js";
import { readDbFixtureSql } from "./dbFixture.js";

function first<T>(rows: T[]): T {
    const row = rows.at(0);
    if (row === undefined) throw new Error("Missing test fixture row");
    return row;
}

describe("published analysis frame reads", () => {
    let container: StartedTestContainer;
    let client: postgres.Sql;
    let db: PostgresJsDatabase;
    let replicaClient: postgres.Sql;
    let replicaDb: PostgresJsDatabase;

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
        await client.unsafe(readDbFixtureSql("analysis-frame-reads.sql"));
        await client.unsafe('CREATE DATABASE "agora_replica"');
        replicaClient = postgres({
            host: container.getHost(),
            port: container.getMappedPort(5432),
            username: "postgres",
            password: "postgres",
            database: "agora_replica",
        });
        replicaDb = drizzle(replicaClient);
        await replicaClient.unsafe(
            readDbFixtureSql("analysis-frame-reads.sql"),
        );
    }, 120_000);
    afterAll(async () => {
        await replicaClient?.end({ timeout: 5 });
        await client?.end({ timeout: 5 });
        await container?.stop();
    });

    async function publishedFrame() {
        const slug = randomUUID().slice(0, 8);
        const project = first(
            await db
                .insert(schema.projectTable)
                .values({
                    slug,
                    title: "Frame test",
                    directoryVisibility: "listed",
                })
                .returning(),
        );
        const config = first(
            await db
                .insert(schema.polisConversationConfigTable)
                .values({ aiLabelingEnabled: true })
                .returning(),
        );
        const conversation = first(
            await db
                .insert(schema.conversationTable)
                .values({
                    slugId: slug,
                    projectId: project.id,
                    polisConfigId: config.id,
                })
                .returning(),
        );
        const content = first(
            await db
                .insert(schema.conversationContentTable)
                .values({
                    conversationId: conversation.id,
                    title: "Frame test",
                })
                .returning(),
        );
        await db
            .update(schema.conversationTable)
            .set({ currentContentId: content.id })
            .where(eq(schema.conversationTable.id, conversation.id));
        const analysisSpec = first(
            await db
                .insert(schema.analysisSpecTable)
                .values({ analysisFamily: "opinion_groups" })
                .returning(),
        );
        const spec = first(
            await db
                .insert(schema.opinionGroupSpecTable)
                .values({
                    analysisSpecId: analysisSpec.id,
                    key: slug,
                    version: 1,
                    reducer: "pca",
                    clusterer: "kmeans",
                    selectionPolicy: "silhouette_size_balance",
                    minClusterableParticipants: 2,
                    minVotesPerParticipant: 1,
                    maxGroupCount: 2,
                })
                .returning(),
        );
        const variant = first(
            await db
                .insert(schema.opinionGroupVariantTable)
                .values({ opinionGroupSpecId: spec.id, groupCount: 2 })
                .returning(),
        );
        const input = first(
            await db
                .insert(schema.analysisInputSnapshotTable)
                .values({
                    conversationId: conversation.id,
                    dataGeneration: 1,
                    inputHash: slug,
                    opinionCount: 0,
                    participantCount: 0,
                    voteCount: 0,
                    compression: "zstd",
                    payload: "",
                })
                .returning(),
        );
        const snapshot = first(
            await db
                .insert(schema.analysisSnapshotTable)
                .values({
                    conversationId: conversation.id,
                    conversationContentId: content.id,
                    inputSnapshotId: input.id,
                    dataGeneration: 1,
                    computedAt: new Date(),
                })
                .returning(),
        );
        const result = first(
            await db
                .insert(schema.analysisSnapshotResultTable)
                .values({
                    conversationId: conversation.id,
                    analysisSnapshotId: snapshot.id,
                    opinionGroupSpecId: spec.id,
                    outcome: "success",
                })
                .returning(),
        );
        const scope = first(
            await db
                .insert(schema.opinionGroupLineageScopeTable)
                .values({
                    conversationId: conversation.id,
                    opinionGroupVariantId: variant.id,
                })
                .returning(),
        );
        const candidate = first(
            await db
                .insert(schema.opinionGroupCandidateTable)
                .values({
                    snapshotResultId: result.id,
                    opinionGroupVariantId: variant.id,
                    scopeId: scope.id,
                    outcome: "success",
                })
                .returning(),
        );
        await db
            .insert(schema.opinionGroupCandidateAssessmentTable)
            .values({ candidateId: candidate.id, selectionScore: 0.9 });
        const lineageIds: number[] = [];
        for (const key of ["0", "1"]) {
            const description = first(
                await db
                    .insert(schema.opinionGroupDescriptionTable)
                    .values({
                        locale: "en",
                        label: `Group ${key}`,
                        summary: "Published group description",
                    })
                    .returning(),
            );
            const lineage = first(
                await db
                    .insert(schema.opinionGroupLineageTable)
                    .values({
                        scopeId: scope.id,
                        systemDescriptionId: description.id,
                    })
                    .returning(),
            );
            lineageIds.push(lineage.id);
            await db.insert(schema.opinionGroupTable).values({
                candidateId: candidate.id,
                lineageId: lineage.id,
                scopeId: scope.id,
                externalId: Number(key),
                key,
                numUsers: 1,
            });
        }
        const viewValues = {
            conversationId: conversation.id,
            conversationContentId: content.id,
            opinionGroupSpecId: spec.id,
            analysisSnapshotId: snapshot.id,
            viewReason: "analysis_completed",
            isClosed: false,
            opinionCount: 0,
            voteCount: 0,
            participantCount: 2,
            totalOpinionCount: 0,
            totalVoteCount: 0,
            totalParticipantCount: 2,
            moderatedOpinionCount: 0,
            hiddenOpinionCount: 0,
            activatedAt: new Date(),
        } satisfies typeof schema.conversationViewSnapshotTable.$inferInsert;
        const view = first(
            await db
                .insert(schema.conversationViewSnapshotTable)
                .values(viewValues)
                .returning(),
        );
        return {
            conversationSlugId: slug,
            polisConfigId: config.id,
            lineageIds,
            frameKey: {
                mode: "live",
                conversationViewSnapshotId: view.id,
                analysisSnapshotId: snapshot.id,
                candidateId: candidate.id,
            } satisfies Parameters<
                typeof fetchAnalysisFrameGroupLabelsByFrameKey
            >[0]["frameKey"],
            viewValues,
        };
    }

    it("keeps a resolved live frame readable after a newer frame publishes", async () => {
        const frame = await publishedFrame();
        await db
            .insert(schema.conversationViewSnapshotTable)
            .values(frame.viewValues);
        const labels = await fetchAnalysisFrameGroupLabelsByFrameKey({
            db,
            ...frame,
            freshnessOptions: null,
        });
        expect(labels.frameKey).toEqual(frame.frameKey);
        expect(Object.keys(labels.labels)).toEqual(["0", "1"]);
    });

    it("serves ready labels in a genuinely read-only transaction", async () => {
        const frame = await publishedFrame();
        const labels = await db.transaction(async (tx) => {
            await tx.execute(sql`SET TRANSACTION READ ONLY`);
            return await fetchAnalysisFrameGroupLabelsByFrameKey({
                db: tx,
                ...frame,
                displayLanguage: "en",
                freshnessOptions: null,
            });
        });
        expect(labels.groupDescriptionDisplay.displayedLocale).toBe("en");
    });

    it("records missing translation demand once without rewriting it on every read", async () => {
        const frame = await publishedFrame();
        const read = async () =>
            await fetchAnalysisFrameGroupLabelsByFrameKey({
                db,
                ...frame,
                displayLanguage: "fr",
                freshnessOptions: null,
            });
        expect((await read()).groupDescriptionDisplay.displayedLocale).toBe(
            "en",
        );
        const before = await db
            .select()
            .from(schema.opinionGroupCandidateDescriptionLocaleRequestTable)
            .where(
                and(
                    eq(
                        schema
                            .opinionGroupCandidateDescriptionLocaleRequestTable
                            .candidateId,
                        frame.frameKey.candidateId,
                    ),
                    eq(
                        schema
                            .opinionGroupCandidateDescriptionLocaleRequestTable
                            .locale,
                        "fr",
                    ),
                ),
            );
        await read();
        expect(
            await db
                .select()
                .from(schema.opinionGroupCandidateDescriptionLocaleRequestTable)
                .where(
                    eq(
                        schema
                            .opinionGroupCandidateDescriptionLocaleRequestTable
                            .candidateId,
                        frame.frameKey.candidateId,
                    ),
                ),
        ).toEqual(before);
    });

    it("still requests English descriptions for a newly selected unlabelled candidate", async () => {
        const frame = await publishedFrame();
        await db
            .update(schema.opinionGroupLineageTable)
            .set({ systemDescriptionId: null })
            .where(
                inArray(schema.opinionGroupLineageTable.id, frame.lineageIds),
            );
        const labels = await fetchAnalysisFrameGroupLabelsByFrameKey({
            db,
            ...frame,
            freshnessOptions: null,
        });
        expect(labels.labels).toEqual({});
        expect(
            await db
                .select()
                .from(schema.opinionGroupCandidateDescriptionLocaleRequestTable)
                .where(
                    eq(
                        schema
                            .opinionGroupCandidateDescriptionLocaleRequestTable
                            .candidateId,
                        frame.frameKey.candidateId,
                    ),
                ),
        ).toMatchObject([{ locale: "en" }]);
        expect(
            await db
                .select()
                .from(schema.opinionGroupLineageDescriptionWorkTable),
        ).toEqual([]);
    });

    it("records missing locale demand after resolving a frame through the primary fallback", async () => {
        const frame = await publishedFrame();
        const labels = await fetchAnalysisFrameGroupLabelsByFrameKey({
            db: withReplicas(db, [replicaDb]),
            ...frame,
            displayLanguage: "fr",
            freshnessOptions: {
                enablePrimaryFallback: true,
                minimumConversationViewSnapshotId: null,
                expectedDescriptionLocales: [],
            },
        });
        expect(labels.groupDescriptionDisplay.displayedLocale).toBe("en");
        expect(
            await db
                .select()
                .from(schema.opinionGroupCandidateDescriptionLocaleRequestTable)
                .where(
                    eq(
                        schema
                            .opinionGroupCandidateDescriptionLocaleRequestTable
                            .candidateId,
                        frame.frameKey.candidateId,
                    ),
                ),
        ).toMatchObject([{ locale: "fr" }]);
    });

    it("keeps AI-disabled frames read-only even when labels are empty", async () => {
        const frame = await publishedFrame();
        await db
            .update(schema.polisConversationConfigTable)
            .set({ aiLabelingEnabled: false })
            .where(
                eq(schema.polisConversationConfigTable.id, frame.polisConfigId),
            );
        const labels = await db.transaction(async (tx) => {
            await tx.execute(sql`SET TRANSACTION READ ONLY`);
            return await fetchAnalysisFrameGroupLabelsByFrameKey({
                db: tx,
                ...frame,
                displayLanguage: "fr",
                freshnessOptions: null,
            });
        });
        expect(labels.labels).toEqual({});
    });

    it("rejects unpublished frames and frame keys from a different conversation", async () => {
        const frame = await publishedFrame();
        await db
            .update(schema.conversationViewSnapshotTable)
            .set({ activatedAt: null })
            .where(
                eq(
                    schema.conversationViewSnapshotTable.id,
                    frame.frameKey.conversationViewSnapshotId,
                ),
            );
        await expect(
            fetchAnalysisFrameGroupLabelsByFrameKey({
                db,
                ...frame,
                freshnessOptions: null,
            }),
        ).rejects.toThrow("not available");
        const other = await publishedFrame();
        await expect(
            fetchAnalysisFrameGroupLabelsByFrameKey({
                db,
                conversationSlugId: frame.conversationSlugId,
                frameKey: other.frameKey,
                freshnessOptions: null,
            }),
        ).rejects.toThrow("not available");
    });
});
