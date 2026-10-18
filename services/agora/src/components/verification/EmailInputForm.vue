<template>
  <div class="container">
    <div :id="descriptionId">{{ t("emailDescription") }}</div>

    <q-input
      ref="emailInput"
      v-bind="inputAccessibility"
      :model-value="emailData.email"
      type="email"
      name="email"
      autocomplete="email"
      outlined
      :autofocus="!$q.platform.is.mobile"
      :placeholder="t('emailPlaceholder')"
      :error="emailData.hasBeenBlurred && emailData.hasError"
      hide-bottom-space
      @focus="isFocused = true"
      @update:model-value="onEmailUpdate"
      @blur="onEmailBlur"
    >
      <template #error>
        <span :id="errorId">{{ emailData.errorMessage }}</span>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { type QInput, useQuasar } from "quasar";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { useElementVisibility } from "src/composables/ui/useElementVisibility";
import { normalizeEmail, zodEmail } from "src/shared/types/zod-email";
import { emailVerificationStore } from "src/stores/onboarding/email";
import {
  type AriaAttributes,
  computed,
  onMounted,
  reactive,
  ref,
  useId,
  useTemplateRef,
} from "vue";

import {
  type EmailInputFormTranslations,
  emailInputFormTranslations,
} from "./EmailInputForm.i18n";

const emit = defineEmits<{
  submit: [];
}>();

const { t } = useComponentI18n<EmailInputFormTranslations>(
  emailInputFormTranslations
);

const $q = useQuasar();
const descriptionId = useId();
const errorId = useId();
const emailInput = useTemplateRef<QInput>("emailInput");
const isFocused = ref(false);
const { reveal } = useElementVisibility({
  target: () => {
    const element = emailInput.value?.nativeEl;
    return element instanceof HTMLElement ? element : undefined;
  },
  enabled: () => isFocused.value,
});

onMounted(() => {
  // Show the field on arrival without opening a mobile keyboard unexpectedly.
  if ($q.platform.is.mobile) reveal();
});

const emailData = reactive({
  email: "",
  isValid: false,
  hasError: false,
  errorMessage: "",
  hasBeenBlurred: false,
});

// QInput forwards native attributes, but its props don't declare every ARIA
// attribute. Check this passthrough against Vue's standard ARIA types.
const inputAccessibility = computed(
  () =>
    ({
      "aria-label": t("emailPlaceholder"),
      "aria-invalid": emailData.hasBeenBlurred && emailData.hasError,
      "aria-describedby":
        emailData.hasBeenBlurred && emailData.hasError
          ? `${descriptionId} ${errorId}`
          : descriptionId,
    }) satisfies AriaAttributes
);

const { verificationEmail } = storeToRefs(emailVerificationStore());

function isValidEmail(email: string): boolean {
  return zodEmail.safeParse(email).success;
}

function clearErrors() {
  emailData.hasError = false;
  emailData.errorMessage = "";
}

function setError(message: string) {
  emailData.hasError = true;
  emailData.errorMessage = message;
}

function validateAndSetErrors() {
  const email = normalizeEmail(String(emailData.email ?? ""));

  if (!email) {
    emailData.isValid = false;
    setError(t("pleaseEnterEmail"));
    return;
  }

  if (!isValidEmail(email)) {
    emailData.isValid = false;
    setError(t("pleaseEnterValidEmail"));
    return;
  }

  emailData.isValid = true;
  clearErrors();
}

function onEmailUpdate(value: string | number | null) {
  const email = normalizeEmail(String(value ?? ""));
  emailData.email = email;
  emailData.isValid = email !== "" && isValidEmail(email);

  if (emailData.hasBeenBlurred) {
    validateAndSetErrors();
  }
}

function onEmailBlur() {
  isFocused.value = false;
  emailData.hasBeenBlurred = true;
  validateAndSetErrors();
}

function getIsValid(): boolean {
  return !emailData.hasBeenBlurred || emailData.isValid;
}

function submit(): boolean {
  emailData.hasBeenBlurred = true;
  validateAndSetErrors();

  if (!emailData.isValid) {
    return false;
  }

  const email = normalizeEmail(String(emailData.email ?? ""));
  emailData.email = email;
  verificationEmail.value = email;
  emit("submit");
  return true;
}

defineExpose({ submit, getIsValid });
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
