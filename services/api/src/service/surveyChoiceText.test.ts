import { describe, expect, it, vi } from "vitest";
import {
    zodSurveyAnswerDraft,
    zodSurveyAnswerSubmission,
} from "@/shared/types/zod.js";
import {
    isSurveyOptionTextWithinLimit,
    normalizeSurveyOptionText,
    normalizeSurveyOptionTextValues,
} from "@/shared/surveyChoiceText.js";
import * as richText from "@/shared/richText.js";
import { groupSurveyAnswerOptionRows } from "./surveyAnswerOptions.js";
import { MAX_BYTES_SURVEY_OPTION_HTML } from "@/shared/shared.js";

describe("survey choice-text contracts", () => {
    it("accepts legacy strings only at the submission boundary", () => {
        const answer = {
            questionType: "choice",
            optionSlugIds: ["option-a"],
            optionTextValues: { "option-a": "Legacy" },
        };
        expect(zodSurveyAnswerSubmission.safeParse(answer).success).toBe(true);
        expect(zodSurveyAnswerDraft.safeParse(answer).success).toBe(false);
    });

    it("rejects oversized HTML before parsing it", () => {
        const converter = vi.spyOn(richText, "htmlToCountedText");
        try {
            expect(
                isSurveyOptionTextWithinLimit({
                    textValueHtml:
                        "<p>" +
                        "é".repeat(MAX_BYTES_SURVEY_OPTION_HTML) +
                        "</p>",
                }),
            ).toBe(false);
            const oversizedDraft = {
                textValueHtml:
                    "<p>" + "é".repeat(MAX_BYTES_SURVEY_OPTION_HTML) + "</p>",
            };
            expect(normalizeSurveyOptionText(oversizedDraft)).toBe(
                oversizedDraft,
            );
            expect(converter).not.toHaveBeenCalled();
        } finally {
            converter.mockRestore();
        }
    });

    it("groups canonical HTML without treating special option IDs as object prototypes", () => {
        const grouped = groupSurveyAnswerOptionRows([
            {
                answerId: 1,
                optionSlugId: "__proto__",
                textValueHtml: "<p>Safe</p>",
            },
            {
                answerId: 1,
                optionSlugId: "toString",
                textValueHtml: "<p>Also safe</p>",
            },
        ]);
        const values = grouped.get(1)?.optionTextValues;
        expect(values).toEqual(
            Object.fromEntries([
                ["__proto__", { textValueHtml: "<p>Safe</p>" }],
                ["toString", { textValueHtml: "<p>Also safe</p>" }],
            ]),
        );
        expect(
            values === undefined ? false : Object.hasOwn(values, "__proto__"),
        ).toBe(true);
    });

    it("rejects duplicate selections and text for an unselected option at the DTO boundary", () => {
        expect(
            zodSurveyAnswerSubmission.safeParse({
                questionType: "choice",
                optionSlugIds: ["option-a", "option-a"],
            }).success,
        ).toBe(false);
        expect(
            zodSurveyAnswerSubmission.safeParse({
                questionType: "choice",
                optionSlugIds: ["option-a"],
                optionTextValues: { "option-b": "Unselected" },
            }).success,
        ).toBe(false);
    });

    it("accepts legacy payloads, blank text, and extended Unicode graphemes", () => {
        for (const optionTextValues of [
            undefined,
            { "option-a": "" },
            { "option-a": "👨‍👩‍👧‍👦".repeat(300) },
        ]) {
            expect(
                zodSurveyAnswerSubmission.safeParse({
                    questionType: "choice",
                    optionSlugIds: ["option-a"],
                    optionTextValues,
                }).success,
            ).toBe(true);
        }
        expect(
            zodSurveyAnswerSubmission.safeParse({
                questionType: "choice",
                optionSlugIds: ["option-a"],
                optionTextValues: { "option-a": " ".repeat(301) },
            }).success,
        ).toBe(false);
    });

    it("normalizes HTML and blank values without mutating the original map", () => {
        const values = {
            "option-a": { textValueHtml: "<p>&lt;literal&gt;\u0000 text</p>" },
            "option-b": { textValueHtml: "<p>\u200B </p>" },
            toString: { textValueHtml: "<p>Saved</p>" },
        };
        expect(normalizeSurveyOptionTextValues(values)).toEqual({
            "option-a": { textValueHtml: "<p>&lt;literal&gt; text</p>" },
            toString: { textValueHtml: "<p>Saved</p>" },
        });
        expect(values["option-a"].textValueHtml).toContain("\u0000");
    });

    it("counts visible rich text rather than markup and enforces the HTML byte cap", () => {
        for (const textValueHtml of [
            "<p><strong>" + "a".repeat(300) + "</strong></p>",
            "<p>" + "é".repeat(300) + "</p>",
        ]) {
            expect(
                zodSurveyAnswerSubmission.safeParse({
                    questionType: "choice",
                    optionSlugIds: ["option-a"],
                    optionTextValues: { "option-a": { textValueHtml } },
                }).success,
            ).toBe(true);
        }
        for (const textValueHtml of [
            "<p>" + "a".repeat(301) + "</p>",
            "<p>" +
                "<strong></strong>".repeat(MAX_BYTES_SURVEY_OPTION_HTML) +
                "</p>",
        ]) {
            expect(
                zodSurveyAnswerSubmission.safeParse({
                    questionType: "choice",
                    optionSlugIds: ["option-a"],
                    optionTextValues: { "option-a": { textValueHtml } },
                }).success,
            ).toBe(false);
        }
    });
});
