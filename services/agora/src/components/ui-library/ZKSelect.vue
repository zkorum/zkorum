<template>
  <q-select
    ref="select"
    :model-value="modelValue"
    outlined
    emit-value
    map-options
    :options="displayOptions"
    :label="label"
    :multiple="multiple"
    :use-chips="resolvedUseChips"
    :counter="counter"
    :max-values="maxValues"
    :display-value="displayValue"
    :clearable="clearable"
    :disable="disable"
    :loading="loading"
    :hide-bottom-space="hideBottomSpace"
    :use-input="searchable"
    :hide-selected="searchable && !multiple"
    :fill-input="searchable && !multiple"
    :input-debounce="searchable ? 0 : undefined"
    :virtual-scroll-sticky-size-start="multiple ? popupActionsHeight : 0"
    @update:model-value="emit('update:modelValue', $event)"
    @filter="handleFilter"
    @popup-hide="handlePopupHide"
  >
    <template v-if="multiple" #before-options>
      <ZKSelectPopupActions
        :label="t('done')"
        :min-height="popupActionsHeight"
        @close="closePopup"
      />
    </template>
    <template v-if="multiple" #no-option>
      <ZKSelectPopupActions
        :label="t('done')"
        :min-height="popupActionsHeight"
        @close="closePopup"
      />
      <div class="q-pa-md text-grey-7">{{ t("noResults") }}</div>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import type { QSelect } from "quasar";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { computed, ref, useTemplateRef, watch } from "vue";

import {
  type ZKSelectTranslations,
  zkSelectTranslations,
} from "./ZKSelect.i18n";
import ZKSelectPopupActions from "./ZKSelectPopupActions.vue";

interface ZKSelectOption {
  label: string;
  value: string;
  disable?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | null;
    options: readonly ZKSelectOption[];
    label: string;
    multiple?: boolean;
    useChips?: boolean;
    counter?: boolean;
    maxValues?: number;
    displayValue?: string;
    searchable?: boolean;
    clearable?: boolean;
    disable?: boolean;
    loading?: boolean;
    hideBottomSpace?: boolean;
  }>(),
  {
    multiple: false,
    useChips: undefined,
    counter: false,
    maxValues: undefined,
    displayValue: undefined,
    searchable: false,
    clearable: false,
    disable: false,
    loading: false,
    hideBottomSpace: true,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | null];
}>();

const select = useTemplateRef<QSelect>("select");
const popupActionsHeight = 56;
const { t } = useComponentI18n<ZKSelectTranslations>(zkSelectTranslations);
const filteredOptions = ref<readonly ZKSelectOption[]>(props.options);

watch(
  () => props.options,
  (options) => {
    filteredOptions.value = options;
  },
  { immediate: true }
);

const displayOptions = computed(() => {
  return props.searchable ? filteredOptions.value : props.options;
});

const resolvedUseChips = computed(() => {
  return props.useChips ?? props.multiple;
});

function handleFilter(
  inputValue: string,
  doneFn: (callbackFn: () => void) => void
): void {
  if (!props.searchable) {
    doneFn(() => {
      filteredOptions.value = props.options;
    });
    return;
  }

  doneFn(() => {
    const needle = inputValue.trim().toLowerCase();

    filteredOptions.value =
      needle.length === 0
        ? props.options
        : props.options.filter((option) => {
            return option.label.toLowerCase().includes(needle);
          });
  });
}

function handlePopupHide(): void {
  filteredOptions.value = props.options;
  if (props.multiple && props.searchable) {
    select.value?.updateInputValue("", true);
  }
}

function closePopup(): void {
  select.value?.hidePopup();
  select.value?.blur();
}
</script>
