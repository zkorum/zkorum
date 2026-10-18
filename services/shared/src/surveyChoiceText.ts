import {
    countPlainTextCharacters,
    countUtf8Bytes,
    hasVisiblePlainText,
    MAX_BYTES_SURVEY_OPTION_TEXT,
    MAX_LENGTH_SURVEY_OPTION_TEXT,
    MAX_BYTES_SURVEY_OPTION_HTML,
} from "./shared.js";
import { htmlToCountedText } from "./richText.js";
import { normalizeUserRichTextHtml } from "./richTextHtml.js";

export interface SurveyOptionText {
    textValueHtml: string;
}

// Accept old clients at the submission boundary, not in stored answers or draft state.
export type SurveyOptionTextInput = string | SurveyOptionText;

export function surveyOptionTextInputToHtml(
    value: SurveyOptionTextInput,
): string {
    if (typeof value !== "string") return value.textValueHtml;
    const escaped = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r\n?/g, "\n")
        .replace(/\n/g, "<br>");
    return escaped.length === 0 ? "" : `<p>${escaped}</p>`;
}

export function surveyOptionTextToPlainText(value: SurveyOptionText): string {
    return htmlToCountedText(value.textValueHtml);
}

export function normalizeSurveyOptionText(
    value: SurveyOptionText,
): SurveyOptionText | undefined {
    // Keep invalid drafts intact for validation without parsing oversized HTML.
    if (!isSurveyOptionHtmlWithinByteLimit(value.textValueHtml)) return value;
    const textValueHtml = normalizeUserRichTextHtml(value.textValueHtml);
    return hasVisiblePlainText(htmlToCountedText(textValueHtml))
        ? { textValueHtml }
        : undefined;
}

export function normalizeSurveyOptionTextValues(
    values: Readonly<Record<string, SurveyOptionText>>,
): Record<string, SurveyOptionText> {
    const entries: (readonly [string, SurveyOptionText])[] = [];
    for (const [optionSlugId, value] of Object.entries(values)) {
        const text = normalizeSurveyOptionText(value);
        if (text !== undefined) entries.push([optionSlugId, text]);
    }
    return Object.fromEntries<SurveyOptionText>(entries);
}

export function surveyOptionTextsEqual({
    left,
    right,
}: {
    left: SurveyOptionText | undefined;
    right: SurveyOptionText | undefined;
}): boolean {
    if (left?.textValueHtml === right?.textValueHtml) return true;
    const normalizedLeft =
        left === undefined ? undefined : normalizeSurveyOptionText(left);
    const normalizedRight =
        right === undefined ? undefined : normalizeSurveyOptionText(right);
    if (normalizedLeft === undefined || normalizedRight === undefined) {
        return normalizedLeft === normalizedRight;
    }
    return normalizedLeft.textValueHtml === normalizedRight.textValueHtml;
}

export function getSurveyOptionText<T>({
    values,
    optionSlugId,
}: {
    values: Readonly<Record<string, T>> | undefined;
    optionSlugId: string;
}): T | undefined {
    return values !== undefined && Object.hasOwn(values, optionSlugId)
        ? values[optionSlugId]
        : undefined;
}

export function isSurveyOptionPlainTextWithinLimit(plainText: string): boolean {
    return (
        countUtf8Bytes(plainText) <= MAX_BYTES_SURVEY_OPTION_TEXT &&
        countPlainTextCharacters(plainText).characterCount <=
            MAX_LENGTH_SURVEY_OPTION_TEXT
    );
}

function isSurveyOptionHtmlWithinByteLimit(html: string): boolean {
    return (
        html.length <= MAX_BYTES_SURVEY_OPTION_HTML &&
        countUtf8Bytes(html) <= MAX_BYTES_SURVEY_OPTION_HTML
    );
}

export function isSurveyOptionTextWithinLimit(
    value: SurveyOptionTextInput,
): boolean {
    if (typeof value === "string")
        return isSurveyOptionPlainTextWithinLimit(value);
    // Reject oversized input before invoking an HTML parser, including in Zod refinements.
    return (
        isSurveyOptionHtmlWithinByteLimit(value.textValueHtml) &&
        isSurveyOptionPlainTextWithinLimit(surveyOptionTextToPlainText(value))
    );
}
