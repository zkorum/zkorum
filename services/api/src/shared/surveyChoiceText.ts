/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
import {
    countPlainTextCharacters,
    countUtf8Bytes,
    hasVisiblePlainText,
    MAX_BYTES_SURVEY_OPTION_TEXT,
    MAX_LENGTH_SURVEY_OPTION_TEXT,
    removeNonDisplayControlCharacters,
} from "./shared.js";

export function normalizeSurveyOptionText(value: string): string | undefined {
    const normalized = removeNonDisplayControlCharacters(value).trim();
    return hasVisiblePlainText(normalized) ? normalized : undefined;
}

export function normalizeSurveyOptionTextValues(
    values: Readonly<Record<string, string>>,
): Record<string, string> {
    const entries: (readonly [string, string])[] = [];
    for (const [optionSlugId, value] of Object.entries(values)) {
        const text = normalizeSurveyOptionText(value);
        if (text !== undefined) entries.push([optionSlugId, text]);
    }
    return Object.fromEntries<string>(entries);
}

export function getSurveyOptionText({
    values,
    optionSlugId,
}: {
    values: Readonly<Record<string, string>> | undefined;
    optionSlugId: string;
}): string | undefined {
    return values !== undefined && Object.hasOwn(values, optionSlugId)
        ? values[optionSlugId]
        : undefined;
}

export function measureSurveyOptionText(value: string): {
    characterCount: number;
    isWithinLimit: boolean;
} {
    const characterCount = countPlainTextCharacters(value).characterCount;
    return {
        characterCount,
        isWithinLimit:
            countUtf8Bytes(value) <= MAX_BYTES_SURVEY_OPTION_TEXT &&
            characterCount <= MAX_LENGTH_SURVEY_OPTION_TEXT,
    };
}

export function isSurveyOptionTextWithinLimit(value: string): boolean {
    return measureSurveyOptionText(value).isWithinLimit;
}
