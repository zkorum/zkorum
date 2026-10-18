<template>
  <InputOtp
    :model-value="modelValue"
    :length="length"
    :integer-only="integerOnly"
    :pt="{ root: groupAttributes }"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @blur="emit('blur', $event)"
  >
    <template #default="{ attrs, events, index }">
      <InputText
        v-bind="attrs"
        class="p-inputotp-input"
        type="text"
        :inputmode="integerOnly ? 'numeric' : 'text'"
        autocomplete="one-time-code"
        :aria-label="t('characterLabel', { index, total: length })"
        v-on="events"
        @click="selectCharacter"
      />
    </template>
  </InputOtp>
</template>

<script setup lang="ts">
import InputOtp from "primevue/inputotp";
import InputText from "primevue/inputtext";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { computed, type HTMLAttributes } from "vue";

import {
  type ZKInputOtpTranslations,
  zkInputOtpTranslations,
} from "./ZKInputOtp.i18n";

withDefaults(
  defineProps<{
    modelValue: string;
    length?: number;
    integerOnly?: boolean;
  }>(),
  {
    length: 6,
    integerOnly: false,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [event: { originalEvent: Event; value: string }];
  blur: [event: Event];
}>();

const { t } = useComponentI18n<ZKInputOtpTranslations>(zkInputOtpTranslations);
const groupAttributes = computed(
  () =>
    ({ role: "group", "aria-label": t("codeLabel") }) satisfies HTMLAttributes
);

function selectCharacter(event: MouseEvent): void {
  if (event.target instanceof HTMLInputElement) event.target.select();
}
</script>
