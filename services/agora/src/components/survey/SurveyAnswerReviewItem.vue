<template>
  <q-item class="survey-question-item">
    <q-item-section class="survey-question-item__section">
      <q-item-label class="survey-question-item__question">
        {{ displayedContent.questionText }}
      </q-item-label>

      <ContentTranslationControl
        v-if="translationPreview !== undefined"
        v-model="translationMode"
        :source-language-label="translationPreview.sourceLanguageLabel"
        :translation-status="translationPreview.translationStatus"
      />

      <div class="survey-question-item__review-row">
        <q-item-label
          :caption="answerPreview === undefined"
          class="survey-question-item__answer"
          :class="{
            'survey-question-item__answer--status': answerPreview === undefined,
          }"
        >
          {{ answerPreview ?? statusLabel }}
        </q-item-label>

        <q-btn
          flat
          no-caps
          color="primary"
          class="survey-question-item__edit-button"
          :label="editLabel"
          @click="emit('edit')"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import ContentTranslationControl from "src/components/translation/ContentTranslationControl.vue";
import type { SupportedSpokenLanguageCodes } from "src/shared/languages";
import {
  getSurveyOptionText,
  surveyOptionTextToPlainText,
} from "src/shared/surveyChoiceText";
import type { SurveyFormSnapshot } from "src/shared/types/dto";
import { useSurveyQuestionDisplayContent } from "src/utils/translation/useSurveyQuestionDisplayContent";
import { computed } from "vue";

const props = defineProps<{
  conversationSlugId: string;
  question: SurveyFormSnapshot["questions"][number];
  sourceLanguageCode: SupportedSpokenLanguageCodes | undefined;
  statusLabel: string;
  editLabel: string;
}>();

const emit = defineEmits<{
  edit: [];
}>();

const originalContent = computed(() => ({
  questionText: props.question.questionText,
  options:
    props.question.questionType === "choice"
      ? props.question.options.map((option) => ({
          optionSlugId: option.optionSlugId,
          optionText: option.optionText,
        }))
      : [],
}));
const { displayedContent, translationPreview, translationMode } =
  useSurveyQuestionDisplayContent({
    conversationSlugId: () => props.conversationSlugId,
    questionSlugId: () => props.question.questionSlugId,
    originalContent,
    displayContent: () => props.question.displayContent,
    sourceLanguageCode: () => props.sourceLanguageCode,
  });

const answerPreview = computed(() => {
  const currentAnswer = props.question.currentAnswer;

  if (currentAnswer === undefined) {
    return undefined;
  }

  if (currentAnswer.questionType === "free_text") {
    const plainText = currentAnswer.textValuePlainText
      .replace(/\s+/g, " ")
      .trim();

    return plainText.length > 0 ? plainText : undefined;
  }

  if (props.question.questionType !== "choice") {
    return undefined;
  }

  const optionTextBySlugId = new Map(
    displayedContent.value.options.map((option) => [
      option.optionSlugId,
      option.optionText,
    ])
  );
  const selectedOptionTexts: string[] = [];
  for (const optionSlugId of currentAnswer.optionSlugIds) {
    const optionText = optionTextBySlugId.get(optionSlugId);
    if (optionText === undefined) continue;

    const optionAnswer = getSurveyOptionText({
      values: currentAnswer.optionTextValues,
      optionSlugId,
    });
    const textValue =
      optionAnswer === undefined
        ? ""
        : surveyOptionTextToPlainText(optionAnswer);
    selectedOptionTexts.push(
      textValue.length === 0 ? optionText : `${optionText} — ${textValue}`
    );
  }

  return selectedOptionTexts.length > 0
    ? selectedOptionTexts.join(", ")
    : undefined;
});
</script>

<style scoped lang="scss">
.survey-question-item {
  align-items: flex-start;
}

.survey-question-item__section {
  gap: 0.5rem;
  width: 100%;
}

.survey-question-item__question {
  white-space: normal;
  line-height: 1.4;
}

.survey-question-item__review-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.survey-question-item__answer {
  white-space: normal;
  color: rgba(0, 0, 0, 0.76);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.survey-question-item__answer--status {
  color: rgba(0, 0, 0, 0.56);
}

.survey-question-item__edit-button {
  align-self: center;
}

@media (max-width: 420px) {
  .survey-question-item__review-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .survey-question-item__edit-button {
    justify-self: end;
  }
}
</style>
