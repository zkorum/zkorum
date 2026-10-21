import type { SurveyQuestionFormItem } from "src/shared/types/zod";
import { afterEach, describe, expect, it } from "vitest";
import { effectScope, nextTick, ref } from "vue";

import { useSurveyAnswerDraft } from "./useSurveyAnswerDraft";

function createQuestion(): Extract<
  SurveyQuestionFormItem,
  { questionType: "choice" }
> {
  return {
    questionSlugId: "question1",
    questionType: "choice",
    questionText: "How do you travel?",
    displayOrder: 0,
    isRequired: true,
    isPublicAggregateSuppressionEnabled: false,
    choiceDisplay: "list",
    constraints: { type: "choice", minSelections: 1, maxSelections: 1 },
    options: [
      { optionSlugId: "bicycle", optionText: "Bicycle", displayOrder: 0 },
      {
        optionSlugId: "other",
        optionText: "Other",
        displayOrder: 1,
        allowsText: true,
      },
    ],
    currentAnswer: {
      questionType: "choice",
      optionSlugIds: ["other"],
      optionTextValues: { other: { textValueHtml: "<p>Saved text</p>" } },
    },
    isPassed: false,
    isStale: false,
    isMissingRequired: false,
    isCurrentAnswerValid: true,
    currentSemanticVersion: 1,
  };
}
const scopes: ReturnType<typeof effectScope>[] = [];
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
});
function createDraft() {
  const scope = effectScope();
  scopes.push(scope);
  const question = ref(createQuestion());
  const viewerUserId = ref("viewer1");
  const draft = scope.run(() =>
    useSurveyAnswerDraft({ question, viewerUserId })
  );
  if (draft === undefined) throw new Error("Expected active test scope");
  return { question, draft, viewerUserId };
}

describe("survey draft hydration", () => {
  it("does not carry an unsaved answer into a new semantic question version", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = {
      textValueHtml: "<p>Old wording draft</p>",
    };
    question.value = {
      ...question.value,
      currentSemanticVersion: 2,
      currentAnswer: undefined,
      isCurrentAnswerValid: false,
      isMissingRequired: true,
    };
    await nextTick();
    expect(draft.optionTextValues.value).toEqual({});
    expect(draft.selectedSingleOptionSlugId.value).toBeNull();
    expect(draft.hasDraftChanged.value).toBe(false);
  });

  it("keeps unsaved text during a background form refresh", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = {
      textValueHtml: "<p>Unsaved text</p>",
    };
    question.value = { ...question.value };
    await nextTick();
    expect(draft.optionTextValues.value.other).toEqual({
      textValueHtml: "<p>Unsaved text</p>",
    });
    expect(draft.hasDraftChanged.value).toBe(true);
  });

  it("hydrates a save echo and resets the changed state", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = {
      textValueHtml: "<p>  Updated text  </p>",
    };
    question.value = {
      ...question.value,
      currentAnswer: {
        questionType: "choice",
        optionSlugIds: ["other"],
        optionTextValues: { other: { textValueHtml: "<p>Updated text</p>" } },
      },
    };
    await nextTick();
    expect(draft.optionTextValues.value.other).toEqual({
      textValueHtml: "<p>Updated text</p>",
    });
    expect(draft.hasDraftChanged.value).toBe(false);
  });

  it("restores the saved value when an author disables a locally edited field", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = {
      textValueHtml: "<p>Unsaved text</p>",
    };
    question.value = {
      ...question.value,
      options: question.value.options.map((option) => ({
        ...option,
        allowsText: false,
      })),
    };
    await nextTick();
    expect(draft.optionTextValues.value.other).toEqual({
      textValueHtml: "<p>Saved text</p>",
    });
    expect(draft.hasDraftChanged.value).toBe(false);
  });

  it("loads the new question rather than carrying text across steps", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = {
      textValueHtml: "<p>Unsaved text</p>",
    };
    question.value = {
      ...question.value,
      questionSlugId: "question2",
      currentAnswer: undefined,
    };
    await nextTick();
    expect(draft.optionTextValues.value).toEqual({});
    expect(draft.selectedSingleOptionSlugId.value).toBeNull();
    expect(draft.isDraftReady.value).toBe(true);
  });

  it("clears private draft text when the viewer changes and then hydrates the new viewer's response", async () => {
    const { question, draft, viewerUserId } = createDraft();
    draft.optionTextValues.value.other = {
      textValueHtml: "<p>Private unsaved text</p>",
    };
    viewerUserId.value = "viewer2";
    await nextTick();
    expect(draft.optionTextValues.value).toEqual({});
    expect(draft.selectedSingleOptionSlugId.value).toBeNull();
    expect(draft.isDraftReady.value).toBe(false);
    question.value = {
      ...question.value,
      currentAnswer: {
        questionType: "choice",
        optionSlugIds: ["other"],
        optionTextValues: {
          other: { textValueHtml: "<p>New viewer's saved text</p>" },
        },
      },
    };
    await nextTick();
    expect(draft.optionTextValues.value.other).toEqual({
      textValueHtml: "<p>New viewer's saved text</p>",
    });
    expect(draft.hasDraftChanged.value).toBe(false);
    expect(draft.isDraftReady.value).toBe(true);
  });
});
