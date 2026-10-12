import type {
  SurveyAnswerDraft,
  SurveyQuestionFormItem,
} from "src/shared/types/zod";
import { describe, expect, it } from "vitest";

import {
  areSurveyAnswersEqual,
  buildSurveyAnswerSubmission,
  getSurveyFreeTextCharacterCount,
  isSurveyAnswerSubmittable,
  normalizeSurveyAnswer,
} from "./answer";

function createChoiceQuestion(
  maxSelections: number
): Extract<SurveyQuestionFormItem, { questionType: "choice" }> {
  return {
    questionType: "choice",
    choiceDisplay: "list",
    questionSlugId: "question1",
    questionText: "How do you travel?",
    isRequired: true,
    isPublicAggregateSuppressionEnabled: false,
    displayOrder: 0,
    constraints: { type: "choice", minSelections: 1, maxSelections },
    options: [
      {
        optionSlugId: "option-a",
        optionText: "Other",
        displayOrder: 0,
        allowsText: true,
      },
      {
        optionSlugId: "option-b",
        optionText: "Bicycle",
        displayOrder: 1,
        allowsText: true,
      },
    ],
    isPassed: false,
    isStale: false,
    isMissingRequired: true,
    isCurrentAnswerValid: false,
    currentSemanticVersion: 1,
  };
}

describe("optional choice text", () => {
  it("does not mistake inherited object keys for accompanying text", () => {
    const question = createChoiceQuestion(1);
    question.options[0].optionSlugId = "toString";
    expect(
      normalizeSurveyAnswer({
        question,
        selectedSingleOptionSlugId: "toString",
        selectedMultiOptionSlugIds: [],
        textValueHtml: "",
        textValuePlainText: "",
      })
    ).toEqual({
      questionType: "choice",
      optionSlugIds: ["toString"],
      optionTextValues: { toString: "" },
    });
  });
  it.each([1, 2])(
    "allows a required choice with blank optional text and a %i-selection limit",
    (maxSelections) => {
      const question = createChoiceQuestion(maxSelections);
      const answer = normalizeSurveyAnswer({
        question,
        selectedSingleOptionSlugId: "option-a",
        selectedMultiOptionSlugIds: ["option-a"],
        textValueHtml: "",
        textValuePlainText: "",
        optionTextValues: { "option-a": "  " },
      });
      expect(answer).toEqual({
        questionType: "choice",
        optionSlugIds: ["option-a"],
        optionTextValues: { "option-a": "  " },
      });
      expect(isSurveyAnswerSubmittable({ question, answer })).toBe(true);
    }
  );

  it("preserves raw text for validation and excludes deselected drafts", () => {
    const question = createChoiceQuestion(2);
    const values = {
      "option-a": " Cargo bike ",
      "option-b": "Electric",
      unused: "Retained local draft",
    };
    const answer = normalizeSurveyAnswer({
      question,
      selectedSingleOptionSlugId: null,
      selectedMultiOptionSlugIds: ["option-a", "option-b"],
      textValueHtml: "",
      textValuePlainText: "",
      optionTextValues: values,
    });
    expect(answer).toEqual({
      questionType: "choice",
      optionSlugIds: ["option-a", "option-b"],
      optionTextValues: { "option-a": " Cargo bike ", "option-b": "Electric" },
    });
    if (answer === undefined) throw new Error("Expected fixture answer");
    expect(buildSurveyAnswerSubmission(answer)).toEqual(answer);
    expect(values.unused).toBe("Retained local draft");
  });

  it("detects text-only edits and explicit clearing", () => {
    const original: SurveyAnswerDraft = {
      questionType: "choice",
      optionSlugIds: ["option-a"],
      optionTextValues: { "option-a": "Cargo bike" },
    };
    expect(
      areSurveyAnswersEqual({
        left: original,
        right: { ...original, optionTextValues: { "option-a": "Tricycle" } },
      })
    ).toBe(false);
    expect(
      areSurveyAnswersEqual({
        left: original,
        right: { ...original, optionTextValues: { "option-a": "" } },
      })
    ).toBe(false);
    expect(
      areSurveyAnswersEqual({
        left: { questionType: "choice", optionSlugIds: ["option-a"] },
        right: { ...original, optionTextValues: { "option-a": "" } },
      })
    ).toBe(true);
  });

  it("enforces the grapheme limit without requiring text", () => {
    const question = createChoiceQuestion(1);
    const answer: SurveyAnswerDraft = {
      questionType: "choice",
      optionSlugIds: ["option-a"],
      optionTextValues: { "option-a": "👨‍👩‍👧‍👦".repeat(300) },
    };
    expect(isSurveyAnswerSubmittable({ question, answer })).toBe(true);
    expect(
      isSurveyAnswerSubmittable({
        question,
        answer: {
          ...answer,
          optionTextValues: { "option-a": "a".repeat(301) },
        },
      })
    ).toBe(false);
    expect(
      isSurveyAnswerSubmittable({
        question,
        answer: { ...answer, optionTextValues: { "option-b": "Unselected" } },
      })
    ).toBe(false);
  });

  it("rejects overlong whitespace instead of trimming it into a submittable draft", () => {
    const question = createChoiceQuestion(1);
    const answer = normalizeSurveyAnswer({
      question,
      selectedSingleOptionSlugId: "option-a",
      selectedMultiOptionSlugIds: [],
      textValueHtml: "",
      textValuePlainText: "",
      optionTextValues: { "option-a": " ".repeat(301) },
    });
    expect(isSurveyAnswerSubmittable({ question, answer })).toBe(false);
  });
});

describe("buildSurveyAnswerSubmission", () => {
  it("strips locally derived plain text from free-text submissions", () => {
    expect(
      buildSurveyAnswerSubmission({
        questionType: "free_text",
        textValueHtml: "<p>Hello world</p>",
        textValuePlainText: "Hello world",
      })
    ).toEqual({
      questionType: "free_text",
      textValueHtml: "<p>Hello world</p>",
    });
  });

  it("preserves choice submissions", () => {
    expect(
      buildSurveyAnswerSubmission({
        questionType: "choice",
        optionSlugIds: ["option-a"],
      })
    ).toEqual({
      questionType: "choice",
      optionSlugIds: ["option-a"],
    });
  });
});

describe("getSurveyFreeTextCharacterCount", () => {
  it("counts extended grapheme clusters", () => {
    expect(
      getSurveyFreeTextCharacterCount({
        textValuePlainText: "👨‍👩‍👧‍👦",
      })
    ).toBe(1);
  });

  it("uses grapheme counts when checking submission limits", () => {
    const question: SurveyQuestionFormItem = {
      questionSlugId: "question1",
      questionType: "free_text",
      questionText: "Describe your household",
      isRequired: true,
      displayOrder: 0,
      constraints: {
        type: "free_text",
        inputMode: "rich_text",
        maxPlainTextLength: 1,
        maxHtmlLength: 100,
      },
      currentAnswer: undefined,
      isPassed: false,
      isMissingRequired: false,
      isStale: false,
      isCurrentAnswerValid: false,
      currentSemanticVersion: 1,
    };

    expect(
      isSurveyAnswerSubmittable({
        question,
        answer: {
          questionType: "free_text",
          textValueHtml: "<p>👨‍👩‍👧‍👦</p>",
          textValuePlainText: "👨‍👩‍👧‍👦",
        },
      })
    ).toBe(true);
  });

  it("rejects answers without visible text", () => {
    const question: SurveyQuestionFormItem = {
      questionSlugId: "question1",
      questionType: "free_text",
      questionText: "Describe your household",
      isRequired: true,
      displayOrder: 0,
      constraints: {
        type: "free_text",
        inputMode: "rich_text",
        maxPlainTextLength: 10,
        maxHtmlLength: 100,
      },
      currentAnswer: undefined,
      isPassed: false,
      isMissingRequired: false,
      isStale: false,
      isCurrentAnswerValid: false,
      currentSemanticVersion: 1,
    };

    expect(
      isSurveyAnswerSubmittable({
        question,
        answer: {
          questionType: "free_text",
          textValueHtml: "<p>\u200B</p>",
          textValuePlainText: "\u200B",
        },
      })
    ).toBe(false);
    expect(
      normalizeSurveyAnswer({
        question,
        selectedSingleOptionSlugId: null,
        selectedMultiOptionSlugIds: [],
        textValueHtml: "<p>\u200B</p>",
        textValuePlainText: "\u200B",
      })
    ).toBeUndefined();
  });
});

describe("areSurveyAnswersEqual", () => {
  it("treats multi-choice answers with the same selections as equal regardless of order", () => {
    const left: SurveyAnswerDraft = {
      questionType: "choice",
      optionSlugIds: ["option-b", "option-a"],
    };
    const right: SurveyAnswerDraft = {
      questionType: "choice",
      optionSlugIds: ["option-a", "option-b"],
    };

    expect(areSurveyAnswersEqual({ left, right })).toBe(true);
  });

  it("keeps single-choice answers order-sensitive through their single selected option", () => {
    const left: SurveyAnswerDraft = {
      questionType: "choice",
      optionSlugIds: ["option-a"],
    };
    const right: SurveyAnswerDraft = {
      questionType: "choice",
      optionSlugIds: ["option-b"],
    };

    expect(areSurveyAnswersEqual({ left, right })).toBe(false);
  });

  it("treats numeric free-text answers as submittable only when they are valid integers", () => {
    const integerQuestion: SurveyQuestionFormItem = {
      questionSlugId: "question1",
      questionType: "free_text",
      questionText: "What is your age?",
      isRequired: true,
      displayOrder: 0,
      constraints: {
        type: "free_text",
        inputMode: "integer",
        minValue: 1,
        maxValue: 120,
      },
      currentAnswer: undefined,
      isPassed: false,
      isMissingRequired: false,
      isStale: false,
      isCurrentAnswerValid: false,
      currentSemanticVersion: 1,
    };

    const normalizedAnswer = normalizeSurveyAnswer({
      question: integerQuestion,
      selectedSingleOptionSlugId: null,
      selectedMultiOptionSlugIds: [],
      textValueHtml: "34",
      textValuePlainText: "34",
    });

    expect(normalizedAnswer).toEqual({
      questionType: "free_text",
      textValueHtml: "34",
      textValuePlainText: "34",
    });
    expect(
      isSurveyAnswerSubmittable({
        question: integerQuestion,
        answer: normalizedAnswer,
      })
    ).toBe(true);
    expect(
      isSurveyAnswerSubmittable({
        question: integerQuestion,
        answer: {
          questionType: "free_text",
          textValueHtml: "12a",
          textValuePlainText: "12a",
        },
      })
    ).toBe(false);
  });
});
