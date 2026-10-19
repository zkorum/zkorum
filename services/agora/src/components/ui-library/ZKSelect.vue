<template>
  <q-select
    ref="select"
    class="zk-select"
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
    :input-debounce="searchable ? 0 : undefined"
    popup-content-class="zk-select-popup"
    options-selected-class="zk-select-popup__option--selected"
    :virtual-scroll-sticky-size-start="popupActionsHeight"
    @update:model-value="emit('update:modelValue', $event)"
    @filter="handleFilter"
    @popup-show="emit('popupShow')"
    @popup-hide="handlePopupHide"
  >
    <template #before-options>
      <ZKSelectPopupActions
        :label="t('done')"
        @close="closePopup"
        @resize="popupActionsHeight = $event"
      />
    </template>
    <template #no-option>
      <ZKSelectPopupActions
        :label="t('done')"
        @close="closePopup"
        @resize="popupActionsHeight = $event"
      />
      <div class="zk-select__empty">{{ t("noResults") }}</div>
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
  popupShow: [];
  popupHide: [];
}>();

const select = useTemplateRef<QSelect>("select");
const popupActionsHeight = ref(0);
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
  if (props.searchable) {
    select.value?.updateInputValue("", true);
  }
  emit("popupHide");
}

function closePopup(): void {
  select.value?.hidePopup();
  select.value?.blur();
}
</script>

<style scoped lang="scss">
.zk-select :deep(.q-field__control) {
  border-radius: 16px;
  background: $color-background-default;
}

.zk-select.q-field--outlined:not(.q-field--error):not(.q-field--disabled)
  :deep(.q-field__control::before) {
  border-color: rgba($primary, 0.38);
}

.zk-select :deep(.q-field__native) {
  color: $ink-dark;
}

.zk-select :deep(.q-chip) {
  background: $primary-lightest;
  color: $primary-dark;
}

.zk-select__empty {
  padding: 1rem;
  color: $color-text-weak;
  text-align: center;
}
</style>

<style lang="scss">
// Quasar teleports the popup outside the select's scoped DOM tree.
.q-menu.zk-select-popup {
  border: 1px solid $color-border-weak;
  border-radius: 16px;
  box-shadow: 0 0.5rem 1.5rem rgba($ink-darkest, 0.12);
}

.zk-select-popup .q-item {
  min-height: 3rem;
  padding-block: 0.75rem;
  padding-inline: 1rem;
  color: $ink-dark;
}

.zk-select-popup .q-item.zk-select-popup__option--selected {
  background: $primary-lightest;
  color: $primary-dark;
  font-weight: var(--font-weight-medium);
}
</style>
