import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    surveyAnswerOptionTable,
    surveyQuestionOptionTable,
} from "@/shared-backend/schema.js";

interface SurveyAnswerOptionRow {
    answerId: number;
    optionSlugId: string;
    textValuePlainText: string | undefined;
}

interface SurveyAnswerOptions {
    optionSlugIds: string[];
    optionTextValues: Record<string, string> | undefined;
}

export async function loadSurveyAnswerOptionRows({
    db,
    answerIds,
    includeText,
}: {
    db: PostgresJsDatabase;
    answerIds: number[];
    includeText: boolean;
}): Promise<SurveyAnswerOptionRow[]> {
    if (answerIds.length === 0) return [];
    const selection = {
        answerId: surveyAnswerOptionTable.surveyAnswerId,
        optionSlugId: surveyQuestionOptionTable.slugId,
    };
    const rows = await db
        .select(
            includeText
                ? {
                      ...selection,
                      textValuePlainText:
                          surveyAnswerOptionTable.textValuePlainText,
                  }
                : selection,
        )
        .from(surveyAnswerOptionTable)
        .innerJoin(
            surveyQuestionOptionTable,
            eq(
                surveyAnswerOptionTable.surveyQuestionOptionId,
                surveyQuestionOptionTable.id,
            ),
        )
        .where(
            and(
                inArray(surveyAnswerOptionTable.surveyAnswerId, answerIds),
                isNull(surveyAnswerOptionTable.deletedAt),
            ),
        )
        .orderBy(
            asc(surveyAnswerOptionTable.surveyAnswerId),
            asc(surveyQuestionOptionTable.displayOrder),
        );

    return rows.map((row) => ({
        answerId: row.answerId,
        optionSlugId: row.optionSlugId,
        textValuePlainText:
            "textValuePlainText" in row &&
            typeof row.textValuePlainText === "string"
                ? row.textValuePlainText
                : undefined,
    }));
}

export function groupSurveyAnswerOptionRows(
    rows: readonly SurveyAnswerOptionRow[],
): Map<number, SurveyAnswerOptions> {
    const optionsByAnswerId = new Map<number, SurveyAnswerOptions>();
    for (const row of rows) {
        const options: SurveyAnswerOptions = optionsByAnswerId.get(
            row.answerId,
        ) ?? { optionSlugIds: [], optionTextValues: undefined };
        options.optionSlugIds.push(row.optionSlugId);
        if (row.textValuePlainText !== undefined) {
            options.optionTextValues ??= {};
            options.optionTextValues[row.optionSlugId] = row.textValuePlainText;
        }
        optionsByAnswerId.set(row.answerId, options);
    }
    return optionsByAnswerId;
}
