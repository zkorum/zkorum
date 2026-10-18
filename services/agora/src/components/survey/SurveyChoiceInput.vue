<template>
  <div
    class="choice-input"
    :class="{ 'choice-input--spaced': usesDropdown || isMultipleSelection }"
  >
    <ZKSelect
      v-if="usesDropdown"
      :model-value="dropdownModelValue"
      :clearable="!isRequired"
      :label="selectOptionLabel"
      :options="options"
      :searchable="true"
      :multiple="isMultipleSelection"
      :use-chips="isMultipleSelection"
      :counter="isMultipleSelection"
      :max-values="maxSelections"
      @update:model-value="handleDropdownUpdate"
    />
    <div v-for="option in visibleOptions" :key="option.value">
      <q-checkbox
        v-if="!usesDropdown && isMultipleSelection"
        class="choice-input__checkbox"
        :model-value="option.selected"
        :label="option.label"
        :dense="props.density === 'compact'"
        @update:model-value="
          (selected) =>
            handleMultiToggle({
              optionSlugId: option.value,
              selected: selected === true,
            })
        "
      />
      <SurveySelectableOption
        v-else-if="!usesDropdown"
        :label="option.label"
        :selected="option.selected"
        :density="props.density"
        @select="handleSingleSelect({ optionSlugId: option.value })"
      />
      <SurveyOptionTextInput
        v-if="option.showText"
        :class="{ 'choice-input__option-text': !usesDropdown }"
        :option-label="option.label"
        :show-option-label="usesDropdown && visibleOptions.length > 1"
        :text-value="option.textValue"
        :read-only="!option.allowsText"
        @update:text-value="
          (textValue) =>
            handleOptionTextUpdate({ optionSlugId: option.value, textValue })
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasVisiblePlainText } from "src/shared/shared";
import {
  getSurveyOptionText,
  type SurveyOptionText,
  surveyOptionTextToPlainText,
} from "src/shared/surveyChoiceText";
import type { SurveyChoiceDisplay } from "src/shared/types/zod";
import { shouldUseSurveyChoiceDropdown } from "src/utils/survey/config";
import { computed } from "vue";

import ZKSelect from "../ui-library/ZKSelect.vue";
import SurveyOptionTextInput from "./SurveyOptionTextInput.vue";
import SurveySelectableOption from "./SurveySelectableOption.vue";

interface ChoiceOption {
  label: string;
  value: string;
  allowsText: boolean;
}

const props = withDefaults(
  defineProps<{
    choiceDisplay: SurveyChoiceDisplay;
    isMultipleSelection: boolean;
    isRequired: boolean;
    options: readonly ChoiceOption[];
    optionTextValues: Readonly<Record<string, SurveyOptionText>>;
    selectedSingleOptionSlugId: string | null;
    selectedMultiOptionSlugIds: readonly string[];
    selectOptionLabel: string;
    maxSelections: number | undefined;
    density?: "comfortable" | "compact";
  }>(),
  {
    density: "comfortable",
  }
);

const emit = defineEmits<{
  "update:selectedSingleOptionSlugId": [value: string | null];
  "update:selectedMultiOptionSlugIds": [value: string[]];
  "update:optionTextValues": [value: Record<string, SurveyOptionText>];
}>();

const usesDropdown = computed(() => {
  return shouldUseSurveyChoiceDropdown({
    choiceDisplay: props.choiceDisplay,
    optionCount: props.options.length,
  });
});

const dropdownModelValue = computed<string | string[] | null>(() => {
  if (props.isMultipleSelection) {
    return [...props.selectedMultiOptionSlugIds];
  }

  return props.selectedSingleOptionSlugId;
});

const selectedOptionSlugIds = computed(
  () =>
    new Set(
      props.isMultipleSelection
        ? props.selectedMultiOptionSlugIds
        : props.selectedSingleOptionSlugId === null
          ? []
          : [props.selectedSingleOptionSlugId]
    )
);
const visibleOptions = computed(() => {
  const options = props.options.map((option) => {
    const selected = selectedOptionSlugIds.value.has(option.value);
    const textValue = getSurveyOptionText({
      values: props.optionTextValues,
      optionSlugId: option.value,
    }) ?? { textValueHtml: "" };
    return {
      ...option,
      selected,
      textValue,
      showText:
        selected &&
        (option.allowsText ||
          hasVisiblePlainText(surveyOptionTextToPlainText(textValue))),
    };
  });
  return usesDropdown.value
    ? options.filter((option) => option.showText)
    : options;
});

function handleOptionTextUpdate({
  optionSlugId,
  textValue,
}: {
  optionSlugId: string;
  textValue: SurveyOptionText;
}): void {
  emit("update:optionTextValues", {
    ...props.optionTextValues,
    [optionSlugId]: textValue,
  });
}

function handleSingleSelect({ optionSlugId }: { optionSlugId: string }): void {
  if (!props.isRequired && props.selectedSingleOptionSlugId === optionSlugId) {
    emit("update:selectedSingleOptionSlugId", null);
    return;
  }

  emit("update:selectedSingleOptionSlugId", optionSlugId);
}

function handleMultiToggle({
  optionSlugId,
  selected,
}: {
  optionSlugId: string;
  selected: boolean;
}): void {
  const selection = new Set(props.selectedMultiOptionSlugIds);
  if (selected) selection.add(optionSlugId);
  else selection.delete(optionSlugId);
  emit("update:selectedMultiOptionSlugIds", [...selection]);
}

function handleDropdownUpdate(value: string | string[] | null): void {
  if (props.isMultipleSelection) {
    emit(
      "update:selectedMultiOptionSlugIds",
      Array.isArray(value) ? value : []
    );
    return;
  }

  emit(
    "update:selectedSingleOptionSlugId",
    Array.isArray(value) ? null : value
  );
}
</script>

<style scoped lang="scss">
.choice-input {
  display: flex;
  flex-direction: column;
}

.choice-input--spaced {
  gap: 0.75rem;
}

.choice-input__option-text {
  margin-inline-start: 2.225rem;
}

.choice-input__checkbox {
  min-height: 2.25rem;
  width: 100%;
}
</style>
