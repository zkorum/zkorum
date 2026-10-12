import { describe, expect, it } from "vitest";
import { zodSurveyAnswerSubmission } from "@/shared/types/zod.js";
import { normalizeSurveyOptionTextValues } from "@/shared/surveyChoiceText.js";

describe("survey choice-text contracts", () => {
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

    it("normalizes text without interpreting markup or mutating the original map", () => {
        const values = {
            "option-a": "  <literal>\u0000 text  ",
            "option-b": "\u200B ",
            toString: "Saved",
        };
        expect(normalizeSurveyOptionTextValues(values)).toEqual({
            "option-a": "<literal> text",
            toString: "Saved",
        });
        expect(values["option-a"]).toContain("\u0000");
    });
});
