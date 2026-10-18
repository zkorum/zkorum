import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { SurveyOptionText } from "@/shared/surveyChoiceText.js";
import {
    surveyAnswerOptionTable,
    surveyQuestionOptionTable,
} from "@/shared-backend/schema.js";

interface SurveyAnswerOptionRow {
    answerId: number;
    optionSlugId: string;
    textValueHtml: string | undefined;
}

interface SurveyAnswerOptions {
    optionSlugIds: string[];
    optionTextValues: Record<string, SurveyOptionText> | undefined;
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
                      textValueHtml: surveyAnswerOptionTable.textValueHtml,
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
        textValueHtml:
            "textValueHtml" in row && typeof row.textValueHtml === "string"
                ? row.textValueHtml
                : undefined,
    }));
}

export function groupSurveyAnswerOptionRows(
    rows: readonly SurveyAnswerOptionRow[],
): Map<number, SurveyAnswerOptions> {
    const groups = new Map<
        number,
        {
            optionSlugIds: string[];
            textEntries: [string, SurveyOptionText][];
        }
    >();
    for (const row of rows) {
        const options = groups.get(row.answerId) ?? {
            optionSlugIds: [],
            textEntries: [],
        };
        options.optionSlugIds.push(row.optionSlugId);
        if (row.textValueHtml !== undefined) {
            options.textEntries.push([
                row.optionSlugId,
                { textValueHtml: row.textValueHtml },
            ]);
        }
        groups.set(row.answerId, options);
    }
    return new Map(
        Array.from(groups, ([answerId, group]) => [
            answerId,
            {
                optionSlugIds: group.optionSlugIds,
                optionTextValues:
                    group.textEntries.length === 0
                        ? undefined
                        : Object.fromEntries(group.textEntries),
            },
        ]),
    );
}
