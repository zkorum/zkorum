<template>
  <div class="option-text-input">
    <div :id="labelId">
      {{ props.optionLabel }}: {{ t("pleaseSpecifyOptional") }}
    </div>
    <div
      v-if="props.readOnly"
      class="option-text-input__read-only"
      :aria-labelledby="labelId"
    >
      {{ plainText }}
    </div>
    <Editor
      v-else
      :model-value="htmlValue"
      :placeholder="t('pleaseSpecifyOptional')"
      :aria-labelledby="labelId"
      :aria-invalid="!isWithinLimit"
      min-height="3rem"
      :show-toolbar="false"
      :formatting-enabled="false"
      :single-line="false"
      :disabled="false"
      :max-length="MAX_LENGTH_SURVEY_OPTION_TEXT"
      :show-character-count="true"
      @update:model-value="handleTextUpdate"
    />
    <div v-if="!isWithinLimit" class="text-negative" role="alert">
      {{ t("textTooLong") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import Editor from "src/components/editor/Editor.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { MAX_LENGTH_SURVEY_OPTION_TEXT } from "src/shared/shared";
import {
  isSurveyOptionTextWithinLimit,
  type SurveyOptionText,
  surveyOptionTextToPlainText,
} from "src/shared/surveyChoiceText";
import { computed, useId } from "vue";

import {
  type SurveyOptionTextInputTranslations,
  surveyOptionTextInputTranslations,
} from "./SurveyOptionTextInput.i18n";

const props = defineProps<{
  optionLabel: string;
  textValue: SurveyOptionText;
  readOnly: boolean;
}>();
const emit = defineEmits<{ "update:textValue": [value: SurveyOptionText] }>();
const labelId = useId();
const htmlValue = computed(() => props.textValue.textValueHtml);
const plainText = computed(() => surveyOptionTextToPlainText(props.textValue));
const { t } = useComponentI18n<SurveyOptionTextInputTranslations>(
  surveyOptionTextInputTranslations
);
const isWithinLimit = computed(() =>
  isSurveyOptionTextWithinLimit(props.textValue)
);

function handleTextUpdate(textValueHtml: string): void {
  emit("update:textValue", { textValueHtml });
}
</script>

<style scoped lang="scss">
.option-text-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-text-input__read-only {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
