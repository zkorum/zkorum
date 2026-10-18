import { and, eq, isNull, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "node:fs";
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
    conversationContentTable,
    conversationTable,
    polisConversationConfigTable,
    projectTable,
    rankingConversationConfigTable,
    opinionTable,
    opinionContentTable,
    surveyAnswerOptionTable,
    surveyAnswerTable,
    surveyResponseTable,
    userTable,
    voteTable,
    voteContentTable,
} from "../src/shared-backend/schema.js";
import { createExportParticipantMap } from "../src/service/conversationExport/generators/participantMap.js";
import type {
    SurveyAnswerSubmission,
    SurveyConfig,
} from "../src/shared/types/zod.js";
import { readDbFixtureSql } from "./dbFixture.js";
import { MAX_BYTES_SURVEY_OPTION_HTML } from "../src/shared/shared.js";

process.env.NODE_ENV = "test";
process.env.CORS_ORIGIN_LIST = "http://localhost:9000";
process.env.PEPPERS = Buffer.from("0123456789abcdef0123456789abcdef").toString(
    "base64",
);
process.env.VERIFICATOR_SVC_BASE_URL = "http://localhost:3000";
process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";

const { participationCheck } = vi.hoisted(() => ({
    participationCheck: vi.fn(),
}));
vi.mock("../src/service/participationGate.js", () => ({
    checkConversationParticipation: participationCheck,
}));
const surveyModulePromise = import("../src/service/survey.js");
const exportModulePromise =
    import("../src/service/conversationExport/generators/surveyShared.js");

const participantId = "00000000-0000-4000-8000-000000000001";
const conversationSlugId = "survey01";
const now = new Date("2026-10-10T12:00:00Z");
const sourceLanguageMetadata = {
    sourceLanguageCode: null,
    sourceRawLanguageCode: null,
    sourceLanguageProvider: null,
    sourceLanguageConfidence: null,
};

describe("optional choice text persistence", () => {
    let container: StartedTestContainer;
    let client: postgres.Sql;
    let db: PostgresJsDatabase;
    let conversationId: number;
    const queries: string[] = [];

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
        });
        db = drizzle(client, {
            logger: {
                logQuery: (query) => {
                    queries.push(query);
                },
            },
        });
        await db.execute(sql.raw(readDbFixtureSql("survey-option-text.sql")));
        for (const migration of [
            "V0082.1__track_ranking_scoring_inputs.sql",
            "V0089.1__separate_ranking_scoring_invalidations.sql",
            "V0105__exclude_survey_annotations_from_scoring.sql",
        ]) {
            await db.execute(
                sql.raw(
                    readFileSync(
                        new URL(
                            `../database/flyway/${migration}`,
                            import.meta.url,
                        ),
                        "utf8",
                    ),
                ),
            );
        }
    }, 120_000);

    afterAll(async () => {
        await client?.end({ timeout: 5 });
        await container?.stop();
    }, 120_000);

    beforeEach(async () => {
        await db.execute(sql`TRUNCATE TABLE
            survey_answer_option, survey_answer, survey_response,
            survey_question_option_content, survey_question_option,
            survey_question_content, survey_question, survey_config,
            conversation_content, conversation, polis_conversation_config,
            project, "user", realtime_event_outbox_topic, realtime_event_outbox
            , opinion, opinion_content, vote, vote_content
            , ranking_conversation_config
        CASCADE`);
        await db
            .insert(userTable)
            .values({ id: participantId, username: "surveyor" });
        const [project] = await db
            .insert(projectTable)
            .values({
                slug: "survey-project",
                title: "Survey project",
                directoryVisibility: "listed",
            })
            .returning();
        const [polisConfig] = await db
            .insert(polisConversationConfigTable)
            .values({})
            .returning();
        if (project === undefined || polisConfig === undefined)
            throw new Error("Missing fixture project or config");
        const [conversation] = await db
            .insert(conversationTable)
            .values({
                slugId: conversationSlugId,
                projectId: project.id,
                polisConfigId: polisConfig.id,
            })
            .returning();
        if (conversation === undefined)
            throw new Error("Missing fixture conversation");
        conversationId = conversation.id;
        const [content] = await db
            .insert(conversationContentTable)
            .values({ conversationId, title: "Survey text test" })
            .returning();
        if (content === undefined) throw new Error("Missing fixture content");
        await db
            .update(conversationTable)
            .set({ currentContentId: content.id })
            .where(eq(conversationTable.id, conversationId));
        participationCheck.mockResolvedValue({
            success: true,
            participantId,
            conversationId,
            conversationType: "polis",
            rankingMode: null,
        });
    });

    async function configure({
        questionCount = 1,
        allowsText = false,
        maxSelections = 1,
    }: {
        questionCount?: number;
        allowsText?: boolean;
        maxSelections?: number;
    } = {}) {
        const { setSurveyConfigForConversation } = await surveyModulePromise;
        const surveyConfig: SurveyConfig = {
            isOptional: false,
            questions: Array.from({ length: questionCount }, (_, index) => ({
                questionType: "choice",
                choiceDisplay: "list",
                questionText: `Question ${String(index + 1)}`,
                isRequired: true,
                isPublicAggregateSuppressionEnabled: false,
                displayOrder: index,
                constraints: {
                    type: "choice",
                    minSelections: 1,
                    maxSelections,
                },
                options: [
                    { optionText: "Bicycle", displayOrder: 0, allowsText },
                    { optionText: "Other", displayOrder: 1, allowsText },
                ],
            })),
        };
        await db.transaction(
            async (tx) =>
                await setSurveyConfigForConversation({
                    db: tx,
                    conversationSlugId,
                    conversationId,
                    surveyConfig,
                    now,
                    sourceLanguageMetadata,
                }),
        );
    }

    async function save({
        questionSlugId,
        answer,
    }: {
        questionSlugId: string;
        answer: SurveyAnswerSubmission | null;
    }) {
        const { saveSurveyAnswer } = await surveyModulePromise;
        return await saveSurveyAnswer({
            db,
            conversationSlugId,
            questionSlugId,
            answer,
            didWrite: "did:test:survey",
            userAgent: "Vitest",
            now,
            currentDisplayLanguage: "en",
        });
    }

    async function loadState() {
        const { loadSurveyParticipantState } = await surveyModulePromise;
        return await loadSurveyParticipantState({
            db,
            conversationId,
            participantId,
        });
    }

    async function firstQuestion() {
        const state = await loadState();
        const question = state.activeSurveyConfig?.questions[0];
        const [first, other] = question?.options ?? [];
        if (
            question === undefined ||
            first === undefined ||
            other === undefined
        )
            throw new Error("Missing fixture question or options");
        return { question, first, other };
    }

    it("serializes simultaneous first saves and derives completion without a second survey read", async () => {
        const { deriveSurveyGate } = await surveyModulePromise;
        await configure({ questionCount: 2, allowsText: true });
        const state = await loadState();
        const questions = state.activeSurveyConfig?.questions ?? [];
        expect(questions).toHaveLength(2);
        queries.length = 0;
        await Promise.all(
            questions.map(async (question) => {
                const [option] = question.options;
                if (option === undefined)
                    throw new Error("Missing fixture option");
                return await save({
                    questionSlugId: question.slugId,
                    answer: {
                        questionType: "choice",
                        optionSlugIds: [option.slugId],
                        optionTextValues: {
                            [option.slugId]: question.questionText,
                        },
                    },
                });
            }),
        );
        expect(
            queries.filter((query) => query.includes('from "survey_config"')),
        ).toHaveLength(2);
        expect(await db.select().from(surveyResponseTable)).toHaveLength(1);
        const completed = await loadState();
        expect(completed.answersByQuestionId.size).toBe(2);
        expect(
            deriveSurveyGate({ surveyState: completed, participantId }).status,
        ).toBe("complete_valid");
        for (const question of questions) {
            const [option] = question.options;
            if (option === undefined) throw new Error("Missing fixture option");
            expect(
                completed.answersByQuestionId.get(question.id)
                    ?.optionTextValues,
            ).toEqual({
                [option.slugId]: {
                    textValueHtml: `<p>${question.questionText}</p>`,
                },
            });
        }
    });

    it("keeps enabled text fields when a legacy config edit omits the new flag", async () => {
        const {
            getSurveyConfigForConversation,
            setSurveyConfigForConversation,
        } = await surveyModulePromise;
        await configure({ allowsText: true });
        const config = await getSurveyConfigForConversation({
            db,
            conversationId,
        });
        if (config === undefined) throw new Error("Missing fixture config");
        const legacyConfig: SurveyConfig = {
            ...config,
            questions: config.questions.map((question) =>
                question.questionType === "choice"
                    ? {
                          ...question,
                          options: question.options.map((option) => ({
                              optionSlugId: option.optionSlugId,
                              optionText: `${option.optionText}!`,
                              displayOrder: option.displayOrder,
                          })),
                      }
                    : question,
            ),
        };
        await db.transaction(
            async (tx) =>
                await setSurveyConfigForConversation({
                    db: tx,
                    conversationSlugId,
                    conversationId,
                    surveyConfig: legacyConfig,
                    now,
                    sourceLanguageMetadata,
                }),
        );
        expect(
            (await loadState()).activeSurveyConfig?.questions.every(
                (question) =>
                    question.options.every((option) => option.allowsText),
            ),
        ).toBe(true);
    });

    it("updates annotation text in place without invalidating ranking scores, while selection edits still invalidate them", async () => {
        const [rankingConfig] = await db
            .insert(rankingConversationConfigTable)
            .values({ rankingMode: "bws" })
            .returning();
        if (rankingConfig === undefined)
            throw new Error("Missing fixture ranking config");
        await db
            .update(conversationTable)
            .set({
                conversationType: "ranking",
                polisConfigId: null,
                rankingConfigId: rankingConfig.id,
            })
            .where(eq(conversationTable.id, conversationId));
        participationCheck.mockResolvedValue({
            success: true,
            participantId,
            conversationId,
            conversationType: "ranking",
            rankingMode: "bws",
        });
        await configure({ allowsText: true });
        const { question, first, other } = await firstQuestion();
        const answer = {
            questionType: "choice",
            optionSlugIds: [other.slugId],
            optionTextValues: { [other.slugId]: "Cargo bike" },
        } satisfies SurveyAnswerSubmission;
        await save({ questionSlugId: question.slugId, answer });
        const selectionsBefore = await db
            .select()
            .from(surveyAnswerOptionTable)
            .where(isNull(surveyAnswerOptionTable.deletedAt));
        const [before] = await db
            .select()
            .from(rankingConversationConfigTable)
            .where(eq(rankingConversationConfigTable.id, rankingConfig.id));
        await save({
            questionSlugId: question.slugId,
            answer: {
                ...answer,
                optionTextValues: { [other.slugId]: "Tricycle" },
            },
        });
        const [after] = await db
            .select()
            .from(rankingConversationConfigTable)
            .where(eq(rankingConversationConfigTable.id, rankingConfig.id));
        expect(after?.scoringInputRevision).toBe(before?.scoringInputRevision);
        expect(after?.scoringInvalidationRevision).toBe(
            before?.scoringInvalidationRevision,
        );
        const selectionsAfter = await db
            .select()
            .from(surveyAnswerOptionTable)
            .where(isNull(surveyAnswerOptionTable.deletedAt));
        expect(selectionsAfter.map((selection) => selection.id)).toEqual(
            selectionsBefore.map((selection) => selection.id),
        );
        expect(selectionsAfter[0]?.textValuePlainText).toBe("Tricycle");
        await save({
            questionSlugId: question.slugId,
            answer: { questionType: "choice", optionSlugIds: [first.slugId] },
        });
        const [changed] = await db
            .select()
            .from(rankingConversationConfigTable)
            .where(eq(rankingConversationConfigTable.id, rankingConfig.id));
        expect(changed?.scoringInputRevision).toBeGreaterThan(
            after?.scoringInputRevision ?? 0,
        );
    });

    it("preserves the newest text across a concurrent legacy save", async () => {
        await configure({ allowsText: true });
        const { question, other } = await firstQuestion();
        const answer = {
            questionType: "choice",
            optionSlugIds: [other.slugId],
        } satisfies SurveyAnswerSubmission;
        await save({
            questionSlugId: question.slugId,
            answer: {
                ...answer,
                optionTextValues: { [other.slugId]: "Old text" },
            },
        });
        await Promise.all([
            save({
                questionSlugId: question.slugId,
                answer: {
                    ...answer,
                    optionTextValues: { [other.slugId]: "Newest text" },
                },
            }),
            save({ questionSlugId: question.slugId, answer }),
        ]);
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toEqual({ [other.slugId]: { textValueHtml: "<p>Newest text</p>" } });
    });

    it.each([
        { questionCount: 1, maxSelections: 1 },
        { questionCount: 3, maxSelections: 1 },
        { questionCount: 1, maxSelections: 2 },
        { questionCount: 3, maxSelections: 2 },
    ])(
        "edits a published $questionCount-question survey with $maxSelections selections while preserving IDs, answers, and completion",
        async ({ questionCount, maxSelections }) => {
            const {
                getSurveyConfigForConversation,
                setSurveyConfigForConversation,
                deriveSurveyGate,
            } = await surveyModulePromise;
            await configure({ questionCount, maxSelections });
            const before = await loadState();
            for (const question of before.activeSurveyConfig?.questions ?? []) {
                const [option] = question.options;
                if (option === undefined)
                    throw new Error("Missing fixture option");
                await save({
                    questionSlugId: question.slugId,
                    answer: {
                        questionType: "choice",
                        optionSlugIds:
                            maxSelections === 1
                                ? [option.slugId]
                                : question.options.map(
                                      (selectedOption) => selectedOption.slugId,
                                  ),
                    },
                });
            }
            const completed = await loadState();
            const config = await getSurveyConfigForConversation({
                db,
                conversationId,
            });
            if (config === undefined) throw new Error("Missing fixture survey");
            for (const question of config.questions) {
                if (question.questionType === "choice") {
                    for (const option of question.options)
                        option.allowsText = true;
                }
            }
            const effect = await db.transaction(
                async (tx) =>
                    await setSurveyConfigForConversation({
                        db: tx,
                        conversationSlugId,
                        conversationId,
                        surveyConfig: config,
                        now,
                        sourceLanguageMetadata,
                    }),
            );
            expect(effect.didRequiredQuestionSemanticChange).toBe(false);
            const edited = await loadState();
            expect(
                deriveSurveyGate({ surveyState: edited, participantId }).status,
            ).toBe("complete_valid");
            expect(edited.response?.completedAt).toEqual(
                completed.response?.completedAt,
            );
            expect(edited.answersByQuestionId).toEqual(
                completed.answersByQuestionId,
            );
            expect(
                edited.activeSurveyConfig?.questions.map((question) => ({
                    id: question.id,
                    slugId: question.slugId,
                    version: question.currentSemanticVersion,
                    options: question.options.map((option) => ({
                        id: option.id,
                        slugId: option.slugId,
                    })),
                })),
            ).toEqual(
                before.activeSurveyConfig?.questions.map((question) => ({
                    id: question.id,
                    slugId: question.slugId,
                    version: question.currentSemanticVersion,
                    options: question.options.map((option) => ({
                        id: option.id,
                        slugId: option.slugId,
                    })),
                })),
            );
            expect(
                edited.activeSurveyConfig?.questions.every((question) =>
                    question.options.every((option) => option.allowsText),
                ),
            ).toBe(true);
        },
    );

    it("round-trips separate multi-choice texts, text-only edits, legacy payloads, and explicit clearing", async () => {
        await configure({ allowsText: true, maxSelections: 2 });
        const { question, first, other } = await firstQuestion();
        const optionSlugIds = [first.slugId, other.slugId];
        await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds,
                optionTextValues: {
                    [first.slugId]: " Electric ",
                    [other.slugId]: 'Cargo bike, "family"\n<literal text>',
                },
            },
        });
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toEqual({
            [first.slugId]: { textValueHtml: "<p>Electric</p>" },
            [other.slugId]: {
                textValueHtml:
                    '<p>Cargo bike, "family"<br />&lt;literal text&gt;</p>',
            },
        });
        await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds,
                optionTextValues: {
                    [first.slugId]: "Electric",
                    [other.slugId]: "Tricycle",
                },
            },
        });
        await save({
            questionSlugId: question.slugId,
            answer: { questionType: "choice", optionSlugIds },
        });
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toEqual({
            [first.slugId]: { textValueHtml: "<p>Electric</p>" },
            [other.slugId]: { textValueHtml: "<p>Tricycle</p>" },
        });
        const result = await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds,
                optionTextValues: {},
            },
        });
        expect(result).toMatchObject({
            success: true,
            surveyGate: { status: "complete_valid" },
        });
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toBeUndefined();
    });

    it("sanitizes and round-trips formatted option answers with derived plain text", async () => {
        await configure({ allowsText: true });
        const { question, other } = await firstQuestion();
        const answer = {
            questionType: "choice",
            optionSlugIds: [other.slugId],
            optionTextValues: {
                [other.slugId]: {
                    textValueHtml:
                        '<p onclick="alert(1)"><strong>Cargo\u202E bike</strong></p><script>alert(1)</script><p></p><p></p><ul><li><p>Family</p></li></ul>',
                },
            },
        } satisfies SurveyAnswerSubmission;
        await save({ questionSlugId: question.slugId, answer });
        const html =
            "<p><strong>Cargo bike</strong></p><p></p><ul><li><p>Family</p></li></ul>";
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toEqual({
            [other.slugId]: { textValueHtml: html },
        });
        const [stored] = await db
            .select()
            .from(surveyAnswerOptionTable)
            .where(isNull(surveyAnswerOptionTable.deletedAt));
        expect(stored).toMatchObject({
            textValueHtml: html,
            textValuePlainText: "Cargo bike\n\n- Family",
        });

        // Formatting-only edits must be persisted even when the derived text is unchanged.
        await save({
            questionSlugId: question.slugId,
            answer: {
                ...answer,
                optionTextValues: {
                    [other.slugId]: {
                        textValueHtml:
                            "<p><em>Cargo bike</em></p><ul><li><p>Family</p></li></ul>",
                    },
                },
            },
        });
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toEqual({
            [other.slugId]: {
                textValueHtml:
                    "<p><em>Cargo bike</em></p><ul><li><p>Family</p></li></ul>",
            },
        });
        await save({
            questionSlugId: question.slugId,
            answer: {
                ...answer,
                optionTextValues: {
                    [other.slugId]: { textValueHtml: "<p><br></p>" },
                },
            },
        });
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toBeUndefined();
        const [cleared] = await db
            .select()
            .from(surveyAnswerOptionTable)
            .where(isNull(surveyAnswerOptionTable.deletedAt));
        expect(cleared).toMatchObject({
            textValueHtml: null,
            textValuePlainText: null,
        });
    });

    it.each([
        {
            plainText: '<literal> & "quotes"\r\nNext\rLast\nEnd',
            html: '<p>&lt;literal&gt; &amp; "quotes"<br>Next<br>Last<br>End</p>',
        },
        {
            plainText: "&" + "\u0301".repeat(8_191),
            html: "<p>&amp;" + "\u0301".repeat(8_191) + "</p>",
        },
    ])(
        "backfills legacy rows before enforcing paired content, preserving rich text and tombstones",
        async ({ plainText, html }) => {
            await configure({ allowsText: true, maxSelections: 2 });
            const { question, first, other } = await firstQuestion();
            await save({
                questionSlugId: question.slugId,
                answer: {
                    questionType: "choice",
                    optionSlugIds: [first.slugId, other.slugId],
                    optionTextValues: {
                        [first.slugId]: {
                            textValueHtml:
                                "<p><strong>Already formatted</strong></p>",
                        },
                        [other.slugId]: "Legacy text",
                    },
                },
            });
            // Recreate the expanded schema and legacy data, then run the actual migration files.
            await db.execute(
                sql`ALTER TABLE survey_answer_option DROP CONSTRAINT survey_answer_option_text_pair_check`,
            );
            try {
                await db.execute(
                    sql.raw(
                        readFileSync(
                            new URL(
                                "../database/flyway/V0107__steep_skreet.sql",
                                import.meta.url,
                            ),
                            "utf8",
                        ),
                    ),
                );
                await db
                    .update(surveyAnswerOptionTable)
                    .set({
                        textValueHtml: null,
                        textValuePlainText: plainText,
                        deletedAt: now,
                    })
                    .where(
                        eq(
                            surveyAnswerOptionTable.surveyQuestionOptionId,
                            other.id,
                        ),
                    );
                await db.execute(
                    sql.raw(
                        readFileSync(
                            new URL(
                                "../database/flyway/V0107.0.1__petite_mesmero.sql",
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
                                "../database/flyway/V0107.1__backfill_survey_option_answer_html.sql",
                                import.meta.url,
                            ),
                            "utf8",
                        ),
                    ),
                );
            } finally {
                await db.execute(
                    sql.raw(
                        readFileSync(
                            new URL(
                                "../database/flyway/V0108__mature_next_avengers.sql",
                                import.meta.url,
                            ),
                            "utf8",
                        ),
                    ),
                );
            }
            const rows = await db.select().from(surveyAnswerOptionTable);
            expect(
                rows.find((row) => row.surveyQuestionOptionId === first.id),
            ).toMatchObject({
                textValueHtml: "<p><strong>Already formatted</strong></p>",
                textValuePlainText: "Already formatted",
                deletedAt: null,
            });
            expect(
                rows.find((row) => row.surveyQuestionOptionId === other.id),
            ).toMatchObject({
                textValueHtml: html,
                textValuePlainText: plainText,
                deletedAt: now,
            });
        },
    );

    it("round-trips valid legacy Unicode whose escaped HTML exceeds the generic rich-text limit", async () => {
        await configure({ allowsText: true });
        const { question, other } = await firstQuestion();
        const text = "&" + "\u0301".repeat(8_191);
        await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds: [other.slugId],
                optionTextValues: { [other.slugId]: text },
            },
        });
        const state = await loadState();
        expect(
            state.answersByQuestionId.get(question.id)?.optionTextValues,
        ).toEqual({
            [other.slugId]: {
                textValueHtml: "<p>&amp;" + "\u0301".repeat(8_191) + "</p>",
            },
        });
        const { deriveSurveyGate } = await surveyModulePromise;
        expect(
            deriveSurveyGate({ surveyState: state, participantId }).status,
        ).toBe("complete_valid");
    });

    it("rejects incomplete content pairs and oversized HTML in the database", async () => {
        await configure({ allowsText: true });
        const { question, other } = await firstQuestion();
        await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds: [other.slugId],
                optionTextValues: {
                    [other.slugId]: { textValueHtml: "<p>Valid</p>" },
                },
            },
        });
        for (const invalidContent of [
            { textValueHtml: null },
            { textValuePlainText: null },
            { textValueHtml: "é".repeat(MAX_BYTES_SURVEY_OPTION_HTML) },
        ]) {
            await expect(
                db
                    .update(surveyAnswerOptionTable)
                    .set(invalidContent)
                    .where(
                        eq(
                            surveyAnswerOptionTable.surveyQuestionOptionId,
                            other.id,
                        ),
                    ),
            ).rejects.toMatchObject({ cause: { code: "23514" } });
        }
    });

    it("preserves collected text after disabling the field, but rejects new text on it", async () => {
        const {
            getSurveyConfigForConversation,
            setSurveyConfigForConversation,
            deriveSurveyGate,
        } = await surveyModulePromise;
        await configure({ allowsText: true });
        const { question, other } = await firstQuestion();
        const answer = {
            questionType: "choice",
            optionSlugIds: [other.slugId],
            optionTextValues: { [other.slugId]: "Cargo bike" },
        } satisfies SurveyAnswerSubmission;
        await save({ questionSlugId: question.slugId, answer });
        const config = await getSurveyConfigForConversation({
            db,
            conversationId,
        });
        if (config === undefined) throw new Error("Missing fixture config");
        for (const item of config.questions) {
            if (item.questionType === "choice")
                for (const option of item.options) option.allowsText = false;
        }
        await db.transaction(
            async (tx) =>
                await setSurveyConfigForConversation({
                    db: tx,
                    conversationSlugId,
                    conversationId,
                    surveyConfig: config,
                    now,
                    sourceLanguageMetadata,
                }),
        );
        await save({ questionSlugId: question.slugId, answer });
        const state = await loadState();
        expect(
            deriveSurveyGate({ surveyState: state, participantId }).status,
        ).toBe("complete_valid");
        expect(
            state.answersByQuestionId.get(question.id)?.optionTextValues?.[
                other.slugId
            ],
        ).toEqual({ textValueHtml: "<p>Cargo bike</p>" });
        await expect(
            save({
                questionSlugId: question.slugId,
                answer: {
                    ...answer,
                    optionTextValues: { [other.slugId]: "New text" },
                },
            }),
        ).rejects.toThrow("does not allow text");
    });

    it("soft-deletes accompanying text on deselection and withdrawal", async () => {
        const { withdrawSurveyResponse } = await surveyModulePromise;
        await configure({ allowsText: true });
        const { question, first, other } = await firstQuestion();
        await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds: [other.slugId],
                optionTextValues: { [other.slugId]: "Cargo bike" },
            },
        });
        await save({
            questionSlugId: question.slugId,
            answer: { questionType: "choice", optionSlugIds: [first.slugId] },
        });
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionTextValues,
        ).toBeUndefined();
        expect(
            await db
                .select()
                .from(surveyAnswerOptionTable)
                .where(
                    and(
                        eq(
                            surveyAnswerOptionTable.surveyQuestionOptionId,
                            other.id,
                        ),
                        isNull(surveyAnswerOptionTable.deletedAt),
                    ),
                ),
        ).toHaveLength(0);
        await withdrawSurveyResponse({
            db,
            conversationSlugId,
            didWrite: "did:test:survey",
            userAgent: "Vitest",
            now,
            currentDisplayLanguage: "en",
        });
        expect((await loadState()).answersByQuestionId.size).toBe(0);
        expect(
            await db
                .select()
                .from(surveyAnswerOptionTable)
                .where(isNull(surveyAnswerOptionTable.deletedAt)),
        ).toHaveLength(0);
        expect(
            await db
                .select()
                .from(surveyAnswerTable)
                .where(isNull(surveyAnswerTable.deletedAt)),
        ).toHaveLength(0);
    });

    it("rejects unselected text and text over the limit without changing a saved answer", async () => {
        await configure({ allowsText: true });
        const { question, first, other } = await firstQuestion();
        const answer = {
            questionType: "choice",
            optionSlugIds: [first.slugId],
        } satisfies SurveyAnswerSubmission;
        await save({ questionSlugId: question.slugId, answer });
        await expect(
            save({
                questionSlugId: question.slugId,
                answer: {
                    ...answer,
                    optionTextValues: { [other.slugId]: "Unselected" },
                },
            }),
        ).rejects.toThrow("Invalid survey answer");
        await expect(
            save({
                questionSlugId: question.slugId,
                answer: {
                    ...answer,
                    optionTextValues: { [first.slugId]: "x".repeat(301) },
                },
            }),
        ).rejects.toThrow("Invalid survey answer");
        expect(
            (await loadState()).answersByQuestionId.get(question.id)
                ?.optionSlugIds,
        ).toEqual([first.slugId]);
    });

    it("loads accompanying text from persisted selections into the owner export", async () => {
        const { buildSurveyParticipantResponseRows, loadSurveyExportContext } =
            await exportModulePromise;
        await configure({ allowsText: true });
        const { question, other } = await firstQuestion();
        await save({
            questionSlugId: question.slugId,
            answer: {
                questionType: "choice",
                optionSlugIds: [other.slugId],
                optionTextValues: { [other.slugId]: "Cargo bike" },
            },
        });
        const [conversation] = await db
            .select({ currentContentId: conversationTable.currentContentId })
            .from(conversationTable)
            .where(eq(conversationTable.id, conversationId));
        if (
            conversation?.currentContentId === null ||
            conversation?.currentContentId === undefined
        )
            throw new Error("Missing fixture conversation content");
        const [opinion] = await db
            .insert(opinionTable)
            .values({
                slugId: "opinion1",
                authorId: participantId,
                conversationId,
            })
            .returning();
        if (opinion === undefined) throw new Error("Missing fixture opinion");
        const [opinionContent] = await db
            .insert(opinionContentTable)
            .values({
                opinionId: opinion.id,
                conversationContentId: conversation.currentContentId,
                content: "Test statement",
                contentPlainText: "Test statement",
            })
            .returning();
        if (opinionContent === undefined)
            throw new Error("Missing fixture opinion content");
        await db
            .update(opinionTable)
            .set({ currentContentId: opinionContent.id })
            .where(eq(opinionTable.id, opinion.id));
        const [vote] = await db
            .insert(voteTable)
            .values({ authorId: participantId, opinionId: opinion.id })
            .returning();
        if (vote === undefined) throw new Error("Missing fixture vote");
        const [voteContent] = await db
            .insert(voteContentTable)
            .values({
                voteId: vote.id,
                opinionContentId: opinionContent.id,
                vote: "agree",
            })
            .returning();
        if (voteContent === undefined)
            throw new Error("Missing fixture vote content");
        await db
            .update(voteTable)
            .set({ currentContentId: voteContent.id })
            .where(eq(voteTable.id, vote.id));
        const context = await loadSurveyExportContext({
            db,
            conversationId,
            includeClusterMemberships: false,
            includeOptionText: true,
        });
        expect(
            buildSurveyParticipantResponseRows({
                context,
                participantMap: createExportParticipantMap(),
            }),
        ).toMatchObject([
            {
                "participant-id": 0,
                "question-id": 0,
                "option-id": 1,
                "answer-text-plain": "Cargo bike",
                "answer-text-html": "<p>Cargo bike</p>",
            },
        ]);
        queries.length = 0;
        const publicContext = await loadSurveyExportContext({
            db,
            conversationId,
            includeClusterMemberships: false,
        });
        const optionQueries = queries.filter((query) =>
            query.includes('from "survey_answer_option"'),
        );
        expect(optionQueries).toHaveLength(1);
        expect(
            optionQueries.every(
                (query) => !query.includes('"text_value_plain_text"'),
            ),
        ).toBe(true);
        expect(
            publicContext.participantStates[0]?.surveyState.answersByQuestionId.get(
                question.id,
            )?.optionTextValues,
        ).toBeUndefined();
    });
});
