import type { SurveyConfig } from "src/shared/types/zod";
import { describe, expect, it } from "vitest";

import {
  areSurveyConfigsEqual,
  buildSurveyConfigForSave,
  cloneSurveyConfig,
  summarizeSurveyConfigChanges,
} from "./config";

function createChoiceSurveyConfig(): SurveyConfig {
  return {
    isOptional: false,
    questions: [
      {
        questionType: "choice",
        choiceDisplay: "auto",
        isPublicAggregateSuppressionEnabled: false,
        questionText: "Pick one",
        isRequired: true,
        displayOrder: 0,
        constraints: {
          type: "choice",
          minSelections: 1,
          maxSelections: 1,
        },
        options: [
          { optionText: "A", displayOrder: 0 },
          { optionText: "B", displayOrder: 1 },
        ],
      },
    ],
  };
}

describe("buildSurveyConfigForSave", () => {
  it.each([1, 3])(
    "saves optional-text edits to an existing %i-question survey without changing identities or selection limits",
    (questionCount) => {
      const original = createChoiceSurveyConfig();
      const [template] = original.questions;
      if (template.questionType !== "choice")
        throw new Error("Expected fixture choice question");
      original.questions = Array.from(
        { length: questionCount },
        (_, index) => ({
          ...template,
          questionSlugId: `question${index}`,
          displayOrder: index,
          constraints: {
            type: "choice",
            minSelections: 1,
            maxSelections: index === 0 ? 1 : 2,
          },
          options: template.options.map((option, optionIndex) => ({
            ...option,
            optionSlugId: `option${index}${optionIndex}`,
          })),
        })
      );
      const edited = cloneSurveyConfig({ surveyConfig: original });
      if (edited === null) throw new Error("Expected fixture config");
      for (const question of edited.questions) {
        if (question.questionType === "choice")
          question.options[1].allowsText = true;
      }

      expect(areSurveyConfigsEqual({ left: original, right: edited })).toBe(
        false
      );
      expect(
        summarizeSurveyConfigChanges({
          previousSurveyConfig: original,
          nextSurveyConfig: edited,
        })
      ).toMatchObject({
        addedQuestionCount: 0,
        removedQuestionCount: 0,
        addedOptionCount: 0,
        removedOptionCount: 0,
        updatedOptionCount: questionCount,
      });
      const result = buildSurveyConfigForSave({ surveyConfig: edited });
      expect(result).toMatchObject({ success: true, surveyConfig: edited });
      expect(edited.questions.map((question) => question.constraints)).toEqual(
        original.questions.map((question) => question.constraints)
      );
    }
  );

  it("treats legacy options without the setting as equivalent to disabled text fields", () => {
    const original = createChoiceSurveyConfig();
    const edited = cloneSurveyConfig({ surveyConfig: original });
    if (edited === null) throw new Error("Expected fixture config");
    for (const question of edited.questions) {
      if (question.questionType === "choice") {
        for (const option of question.options) option.allowsText = false;
      }
    }
    expect(areSurveyConfigsEqual({ left: original, right: edited })).toBe(true);
  });
  it("rejects an added empty question instead of dropping the survey", () => {
    const surveyConfig = createChoiceSurveyConfig();
    surveyConfig.questions[0].questionText = "";

    expect(buildSurveyConfigForSave({ surveyConfig })).toMatchObject({
      success: false,
    });
  });

  it("rejects empty choice options", () => {
    const surveyConfig = createChoiceSurveyConfig();
    if (surveyConfig.questions[0].questionType !== "choice") {
      throw new Error("Expected choice question");
    }
    surveyConfig.questions[0].options[1].optionText = "";

    expect(buildSurveyConfigForSave({ surveyConfig })).toMatchObject({
      success: false,
    });
  });

  it("clamps maximum selections to the number of options", () => {
    const surveyConfig = createChoiceSurveyConfig();
    if (surveyConfig.questions[0].questionType !== "choice") {
      throw new Error("Expected choice question");
    }
    surveyConfig.questions[0].constraints.maxSelections = 4;

    const result = buildSurveyConfigForSave({ surveyConfig });

    expect(result.success).toBe(true);
    if (!result.success || result.surveyConfig === null) {
      throw new Error("Expected valid survey config");
    }
    const question = result.surveyConfig.questions[0];
    if (question.questionType !== "choice") {
      throw new Error("Expected choice question");
    }
    expect(question.constraints.maxSelections).toBe(2);
  });
});
