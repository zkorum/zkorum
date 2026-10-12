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
      optionTextValues: { other: "Saved text" },
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
  it("keeps unsaved text during a background form refresh", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = "Unsaved text";
    question.value = { ...question.value };
    await nextTick();
    expect(draft.optionTextValues.value.other).toBe("Unsaved text");
    expect(draft.hasDraftChanged.value).toBe(true);
  });

  it("hydrates a save echo and resets the changed state", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = "  Updated text  ";
    question.value = {
      ...question.value,
      currentAnswer: {
        questionType: "choice",
        optionSlugIds: ["other"],
        optionTextValues: { other: "Updated text" },
      },
    };
    await nextTick();
    expect(draft.optionTextValues.value.other).toBe("Updated text");
    expect(draft.hasDraftChanged.value).toBe(false);
  });

  it("restores the saved value when an author disables a locally edited field", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = "Unsaved text";
    question.value = {
      ...question.value,
      options: question.value.options.map((option) => ({
        ...option,
        allowsText: false,
      })),
    };
    await nextTick();
    expect(draft.optionTextValues.value.other).toBe("Saved text");
    expect(draft.hasDraftChanged.value).toBe(false);
  });

  it("loads the new question rather than carrying text across steps", async () => {
    const { question, draft } = createDraft();
    draft.optionTextValues.value.other = "Unsaved text";
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
    draft.optionTextValues.value.other = "Private unsaved text";
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
        optionTextValues: { other: "New viewer's saved text" },
      },
    };
    await nextTick();
    expect(draft.optionTextValues.value.other).toBe("New viewer's saved text");
    expect(draft.hasDraftChanged.value).toBe(false);
    expect(draft.isDraftReady.value).toBe(true);
  });
});
