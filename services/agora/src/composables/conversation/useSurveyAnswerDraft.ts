import {
  getSurveyOptionText,
  type SurveyOptionText,
} from "src/shared/surveyChoiceText";
import type { SurveyQuestionFormItem } from "src/shared/types/zod";
import {
  areSurveyAnswersEqual,
  normalizeSurveyAnswer,
} from "src/utils/survey/answer";
import { isSingleSelectionChoiceQuestion } from "src/utils/survey/config";
import {
  computed,
  type MaybeRefOrGetter,
  ref,
  shallowRef,
  toValue,
  watch,
} from "vue";

export function useSurveyAnswerDraft({
  question,
  viewerUserId,
}: {
  question: MaybeRefOrGetter<SurveyQuestionFormItem | undefined>;
  viewerUserId: MaybeRefOrGetter<string | undefined>;
}) {
  const selectedSingleOptionSlugId = ref<string | null>(null);
  const selectedMultiOptionSlugIds = ref<string[]>([]);
  const optionTextValues = ref<Record<string, SurveyOptionText>>({});
  const textValueHtml = ref("");
  const textValuePlain = ref("");
  const hydratedQuestion = shallowRef<SurveyQuestionFormItem>();

  function clearDraft(): void {
    selectedSingleOptionSlugId.value = null;
    selectedMultiOptionSlugIds.value = [];
    optionTextValues.value = {};
    textValueHtml.value = "";
    textValuePlain.value = "";
  }

  function buildDraft(currentQuestion: SurveyQuestionFormItem) {
    return normalizeSurveyAnswer({
      question: currentQuestion,
      selectedSingleOptionSlugId: selectedSingleOptionSlugId.value,
      selectedMultiOptionSlugIds: selectedMultiOptionSlugIds.value,
      textValueHtml: textValueHtml.value,
      textValuePlainText: textValuePlain.value,
      optionTextValues: optionTextValues.value,
    });
  }
  const draftAnswer = computed(() => {
    const currentQuestion = toValue(question);
    return currentQuestion === undefined
      ? undefined
      : buildDraft(currentQuestion);
  });
  const hasDraftChanged = computed(() => {
    const currentQuestion = toValue(question);
    return (
      hydratedQuestion.value !== undefined &&
      currentQuestion !== undefined &&
      !areSurveyAnswersEqual({
        left: currentQuestion.currentAnswer,
        right: draftAnswer.value,
      })
    );
  });
  const isDraftReady = computed(() => hydratedQuestion.value !== undefined);

  watch(
    computed(() => ({
      question: toValue(question),
      viewerUserId: toValue(viewerUserId),
    })),
    (current, previous) => {
      const currentQuestion = current.question;
      if (
        previous !== undefined &&
        current.viewerUserId !== previous.viewerUserId
      ) {
        hydratedQuestion.value = undefined;
        clearDraft();
        // A viewer-scoped query can change identity before its new data arrives.
        if (currentQuestion === previous.question) return;
      }
      const previousQuestion = hydratedQuestion.value;
      if (
        currentQuestion !== undefined &&
        previousQuestion !== undefined &&
        currentQuestion.questionSlugId === previousQuestion.questionSlugId &&
        currentQuestion.questionType === previousQuestion.questionType &&
        currentQuestion.currentSemanticVersion ===
          previousQuestion.currentSemanticVersion &&
        !areSurveyAnswersEqual({
          left: previousQuestion.currentAnswer,
          right: buildDraft(previousQuestion),
        }) &&
        !areSurveyAnswersEqual({
          left: currentQuestion.currentAnswer,
          right: buildDraft(currentQuestion),
        })
      ) {
        // Keep local edits during background refreshes, but do not keep newly disallowed text.
        if (currentQuestion.questionType === "choice") {
          const savedTextValues =
            currentQuestion.currentAnswer?.questionType === "choice"
              ? currentQuestion.currentAnswer.optionTextValues
              : undefined;
          for (const option of currentQuestion.options) {
            if (option.allowsText !== true) {
              optionTextValues.value[option.optionSlugId] = getSurveyOptionText(
                {
                  values: savedTextValues,
                  optionSlugId: option.optionSlugId,
                }
              ) ?? { textValueHtml: "" };
            }
          }
        }
        return;
      }

      clearDraft();
      hydratedQuestion.value = currentQuestion;
      if (currentQuestion === undefined) return;
      const savedAnswer = currentQuestion.currentAnswer;
      if (
        currentQuestion.questionType === "choice" &&
        savedAnswer?.questionType === "choice"
      ) {
        selectedSingleOptionSlugId.value = isSingleSelectionChoiceQuestion({
          question: currentQuestion,
        })
          ? (savedAnswer.optionSlugIds[0] ?? null)
          : null;
        selectedMultiOptionSlugIds.value = [...savedAnswer.optionSlugIds];
        optionTextValues.value = { ...savedAnswer.optionTextValues };
      } else if (
        currentQuestion.questionType === "free_text" &&
        savedAnswer?.questionType === "free_text"
      ) {
        textValueHtml.value = savedAnswer.textValueHtml;
        textValuePlain.value = savedAnswer.textValuePlainText;
      }
    },
    { immediate: true }
  );

  return {
    selectedSingleOptionSlugId,
    selectedMultiOptionSlugIds,
    optionTextValues,
    textValueHtml,
    textValuePlain,
    draftAnswer,
    hasDraftChanged,
    isDraftReady,
  };
}
