<template>
  <q-input
    :model-value="props.textValue"
    :label="t('pleaseSpecifyOptional')"
    :aria-label="`${props.optionLabel}: ${t('pleaseSpecifyOptional')}`"
    :readonly="props.readOnly"
    :counter="!props.readOnly"
    :maxlength="MAX_BYTES_SURVEY_OPTION_TEXT"
    :error="!measurement.isWithinLimit"
    :error-message="t('textTooLong')"
    type="textarea"
    outlined
    dense
    autogrow
    @update:model-value="handleTextUpdate"
  >
    <template v-if="!props.readOnly" #counter>
      {{ measurement.characterCount }} / {{ MAX_LENGTH_SURVEY_OPTION_TEXT }}
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import {
  MAX_BYTES_SURVEY_OPTION_TEXT,
  MAX_LENGTH_SURVEY_OPTION_TEXT,
} from "src/shared/shared";
import { measureSurveyOptionText } from "src/shared/surveyChoiceText";
import { computed } from "vue";

import {
  type SurveyOptionTextInputTranslations,
  surveyOptionTextInputTranslations,
} from "./SurveyOptionTextInput.i18n";

const props = defineProps<{
  optionLabel: string;
  textValue: string;
  readOnly: boolean;
}>();
const emit = defineEmits<{ "update:textValue": [value: string] }>();
const { t } = useComponentI18n<SurveyOptionTextInputTranslations>(
  surveyOptionTextInputTranslations
);
const measurement = computed(() => measureSurveyOptionText(props.textValue));

function handleTextUpdate(value: string | number | null): void {
  emit("update:textValue", value === null ? "" : String(value));
}
</script>
