import { log } from "@/app.js";
import type { GoogleCloudCredentials } from "@/shared-backend/googleCloudAuth.js";
import {
    conversationContentTable,
    conversationTable,
    opinionContentTable,
    opinionTable,
    surveyQuestionContentTable,
    surveyQuestionOptionContentTable,
    surveyQuestionOptionTable,
    surveyQuestionTable,
} from "@/shared-backend/schema.js";
import { detectLanguage } from "@/shared-backend/translate.js";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    type LanguageDetectionProvider,
    detectLanguageWithFallback,
    type LanguageDetectionHintInput,
} from "./languageDetection.js";
import {
    buildConversationLanguageDetectionCorpus,
    buildGoogleConversationLanguageDetectionCorpus,
} from "./conversationLanguage.js";
import type { SupportedSpokenLanguageCodes } from "@/shared/languages.js";
import type { SurveyConfig } from "@/shared/types/zod.js";
import { htmlToCountedTextWithWarning } from "./richText.js";

export interface ContentLanguageMetadata {
    sourceLanguageCode: SupportedSpokenLanguageCodes | null;
    sourceRawLanguageCode: string | null;
    sourceLanguageProvider: LanguageDetectionProvider | null;
    sourceLanguageConfidence: number | null;
}

export interface ContentLanguageDetectionInput {
    text: string;
    googleText?: string;
    useGoogleLanguageDetection: boolean;
}

export type ContentLanguageMetadataResolver = (
    input: ContentLanguageDetectionInput,
) => Promise<ContentLanguageMetadata>;

export const UNKNOWN_CONTENT_LANGUAGE_METADATA: ContentLanguageMetadata = {
    sourceLanguageCode: null,
    sourceRawLanguageCode: null,
    sourceLanguageProvider: null,
    sourceLanguageConfidence: null,
};

export function buildSurveyLanguageDetectionCorpus({
    surveyConfig,
}: {
    surveyConfig: SurveyConfig | null | undefined;
}): string {
    if (surveyConfig === null || surveyConfig === undefined) {
        return "";
    }
    return surveyConfig.questions
        .flatMap((question) => [
            question.questionText,
            ...(question.questionType === "choice"
                ? question.options.map((option) => option.optionText)
                : []),
        ])
        .join("\n");
}

export function buildContentBlockLanguageDetectionCorpus({
    conversationCorpus,
    surveyConfig,
}: {
    conversationCorpus: string;
    surveyConfig: SurveyConfig | null | undefined;
}): string {
    const surveyCorpus = buildSurveyLanguageDetectionCorpus({ surveyConfig });
    return buildContentBlockLanguageDetectionCorpusFromParts({
        conversationCorpus,
        surveyCorpus,
    });
}

function buildContentBlockLanguageDetectionCorpusFromParts({
    conversationCorpus,
    surveyCorpus,
}: {
    conversationCorpus: string;
    surveyCorpus: string;
}): string {
    return [conversationCorpus, surveyCorpus]
        .map((corpus) => corpus.trim())
        .filter((corpus) => corpus.length > 0)
        .join("\n\n");
}

function buildSurveyLanguageDetectionCorpusFromRows({
    rows,
}: {
    rows: readonly {
        questionText: string;
        optionText: string | null;
    }[];
}): string {
    const texts: string[] = [];
    const seenQuestions = new Set<string>();
    for (const row of rows) {
        if (!seenQuestions.has(row.questionText)) {
            texts.push(row.questionText);
            seenQuestions.add(row.questionText);
        }
        if (row.optionText !== null) {
            texts.push(row.optionText);
        }
    }
    return texts.join("\n");
}

export async function resolveContentLanguageMetadata({
    text,
    googleText,
    googleCloudCredentials,
    useGoogleLanguageDetection,
    languageHints = [],
    localLanguageDetector,
}: {
    text: string;
    googleText?: string;
    googleCloudCredentials: GoogleCloudCredentials | undefined;
    useGoogleLanguageDetection: boolean;
    languageHints?: readonly LanguageDetectionHintInput[];
    localLanguageDetector?: Parameters<
        typeof detectLanguageWithFallback
    >[0]["localDetector"];
}): Promise<ContentLanguageMetadata> {
    if (text.trim().length === 0) {
        return UNKNOWN_CONTENT_LANGUAGE_METADATA;
    }

    try {
        const googleDetector =
            googleCloudCredentials === undefined || !useGoogleLanguageDetection
                ? undefined
                : async ({ text: textToDetect }: { text: string }) =>
                      await detectLanguage({
                          client: googleCloudCredentials.client,
                          text: textToDetect,
                          projectId: googleCloudCredentials.config.projectId,
                          location: googleCloudCredentials.config.location,
                      });
        const detectionResult = await detectLanguageWithFallback({
            text,
            googleText,
            languageHints,
            localDetector: localLanguageDetector,
            googleDetector,
        });
        if (detectionResult === undefined) {
            return UNKNOWN_CONTENT_LANGUAGE_METADATA;
        }
        return {
            sourceLanguageCode: detectionResult.sourceLanguageCode,
            sourceRawLanguageCode: detectionResult.rawLanguageCode,
            sourceLanguageProvider: detectionResult.provider,
            sourceLanguageConfidence: detectionResult.confidence,
        };
    } catch (error) {
        log.warn(
            error,
            "[ContentLanguageMetadata] Failed to detect content language",
        );
        return UNKNOWN_CONTENT_LANGUAGE_METADATA;
    }
}

export function contentLanguageMetadataUpdateValues(
    metadata: ContentLanguageMetadata,
): {
    sourceLanguageCode: SupportedSpokenLanguageCodes | null;
    sourceRawLanguageCode: string | null;
    sourceLanguageProvider: LanguageDetectionProvider | null;
    sourceLanguageConfidence: number | null;
} {
    return metadata;
}

export async function loadCurrentConversationOwnedLanguageSources({
    db,
    conversationId,
}: {
    db: PostgresJsDatabase;
    conversationId: number;
}) {
    const conversationRows = await db
        .select({
            contentId: conversationContentTable.id,
            title: conversationContentTable.title,
            bodyPlainText: conversationContentTable.bodyPlainText,
        })
        .from(conversationTable)
        .innerJoin(
            conversationContentTable,
            eq(conversationContentTable.id, conversationTable.currentContentId),
        )
        .where(eq(conversationTable.id, conversationId))
        .limit(1);
    const conversationContent = conversationRows.at(0);
    if (conversationContent === undefined) {
        return undefined;
    }

    const surveyRows = await db
        .select({
            questionContentId: surveyQuestionContentTable.id,
            questionText: surveyQuestionContentTable.questionText,
            optionContentId: surveyQuestionOptionContentTable.id,
            optionText: surveyQuestionOptionContentTable.optionText,
        })
        .from(surveyQuestionTable)
        .innerJoin(
            surveyQuestionContentTable,
            eq(
                surveyQuestionContentTable.id,
                surveyQuestionTable.currentContentId,
            ),
        )
        .leftJoin(
            surveyQuestionOptionTable,
            eq(
                surveyQuestionOptionTable.surveyQuestionId,
                surveyQuestionTable.id,
            ),
        )
        .leftJoin(
            surveyQuestionOptionContentTable,
            eq(
                surveyQuestionOptionContentTable.id,
                surveyQuestionOptionTable.currentContentId,
            ),
        )
        .where(
            and(
                eq(surveyQuestionTable.conversationId, conversationId),
                isNotNull(surveyQuestionTable.currentContentId),
            ),
        );
    const surveyCorpus = buildSurveyLanguageDetectionCorpusFromRows({
        rows: surveyRows,
    });
    const bodyPlainText = conversationContent.bodyPlainText ?? "";
    const blockInput = {
        text: buildContentBlockLanguageDetectionCorpusFromParts({
            conversationCorpus: buildConversationLanguageDetectionCorpus({
                conversationTitle: conversationContent.title,
                bodyPlainText,
            }),
            surveyCorpus,
        }),
        googleText: buildGoogleConversationLanguageDetectionCorpus({
            conversationTitle: conversationContent.title,
            bodyPlainText,
            supplementalPlainText: surveyCorpus,
        }),
    };

    const questionContentIds = [
        ...new Set(surveyRows.map((row) => row.questionContentId)),
    ];

    const optionContentIds = [
        ...new Set(
            surveyRows
                .map((row) => row.optionContentId)
                .filter((contentId): contentId is number => contentId !== null),
        ),
    ];

    const seedOpinionRows = await db
        .select({
            opinionContentId: opinionContentTable.id,
            slugId: opinionTable.slugId,
            content: opinionContentTable.content,
            contentPlainText: opinionContentTable.contentPlainText,
        })
        .from(opinionTable)
        .innerJoin(
            opinionContentTable,
            eq(opinionContentTable.id, opinionTable.currentContentId),
        )
        .where(
            and(
                eq(opinionTable.conversationId, conversationId),
                eq(opinionTable.isSeed, true),
                isNotNull(opinionTable.currentContentId),
            ),
        );

    return {
        contentId: conversationContent.contentId,
        blockInput,
        questionContentIds,
        optionContentIds,
        seedOpinions: seedOpinionRows.map((opinion) => ({
            contentId: opinion.opinionContentId,
            slugId: opinion.slugId,
            text:
                opinion.contentPlainText ??
                htmlToCountedTextWithWarning({
                    html: opinion.content,
                    context: "seed opinion language metadata",
                }),
        })),
    };
}

export async function refreshCurrentConversationOwnedContentLanguageMetadata({
    db,
    conversationId,
    resolveLanguageMetadata,
    useGoogleLanguageDetection,
}: {
    db: PostgresJsDatabase;
    conversationId: number;
    resolveLanguageMetadata: ContentLanguageMetadataResolver;
    useGoogleLanguageDetection: boolean;
}): Promise<ContentLanguageMetadata | undefined> {
    const sources = await loadCurrentConversationOwnedLanguageSources({
        db,
        conversationId,
    });
    if (sources === undefined) return undefined;
    const blockLanguageMetadata = await resolveLanguageMetadata({
        ...sources.blockInput,
        useGoogleLanguageDetection,
    });
    await db
        .update(conversationContentTable)
        .set(contentLanguageMetadataUpdateValues(blockLanguageMetadata))
        .where(eq(conversationContentTable.id, sources.contentId));
    if (sources.questionContentIds.length > 0)
        await db
            .update(surveyQuestionContentTable)
            .set(contentLanguageMetadataUpdateValues(blockLanguageMetadata))
            .where(
                inArray(
                    surveyQuestionContentTable.id,
                    sources.questionContentIds,
                ),
            );
    if (sources.optionContentIds.length > 0)
        await db
            .update(surveyQuestionOptionContentTable)
            .set(contentLanguageMetadataUpdateValues(blockLanguageMetadata))
            .where(
                inArray(
                    surveyQuestionOptionContentTable.id,
                    sources.optionContentIds,
                ),
            );
    for (const opinion of sources.seedOpinions) {
        const sourceLanguageMetadata = await resolveLanguageMetadata({
            text: opinion.text,
            useGoogleLanguageDetection,
        });
        await db
            .update(opinionContentTable)
            .set(contentLanguageMetadataUpdateValues(sourceLanguageMetadata))
            .where(eq(opinionContentTable.id, opinion.contentId));
    }

    return blockLanguageMetadata;
}
