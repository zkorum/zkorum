<template>
  <div class="container">
    <div
      v-if="countryPolicy.isPending.value"
      class="row justify-center q-pa-md"
    >
      <q-spinner />
    </div>
    <PhoneAuthUnavailableNotice
      v-else-if="!phoneAuthAvailability.available"
      :reason="phoneAuthAvailability.reason"
    />
    <template v-else>
      <div>{{ t("smsDescription") }}</div>

      <ZKPhoneNumberInput
        v-model="phoneData.phoneNumber"
        v-model:country-code="phoneData.countryCode"
        :allowed-countries="allowedCountries"
        :success="phoneData.isValid"
        :error="phoneData.hasError"
        show-code-in-list
        :placeholder="t('phoneNumberPlaceholder')"
        required
        auto-format="blur"
        :validation-error="false"
        aria-describedby="phone-error"
        :on-update="onPhoneUpdate"
        :on-country-code="onCountryCodeUpdate"
        :on-keydown-enter="submit"
      />
      <PhoneTurnstile ref="turnstileWidget" />

      <div
        v-if="
          phoneData.hasError &&
          phoneData.errorMessage &&
          phoneData.hasAttemptedSubmission
        "
        id="phone-error"
        class="error-message"
        role="alert"
        aria-live="polite"
      >
        <q-icon name="mdi-alert-circle" class="error-icon" />
        <span>{{ phoneData.errorMessage }}</span>
      </div>

      <div v-if="devAuthorizedNumbers.length > 0">
        <div class="developmentSection">
          <div>{{ t("developmentNumbers") }}</div>

          <div
            v-for="authorizedNumber in devAuthorizedNumbers"
            :key="authorizedNumber.fullNumber"
          >
            <ZKGradientButton
              :label="authorizedNumber.fullNumber"
              label-color="#FFFFFF"
              :style="{ width: '100%' }"
              @click="injectDevelopmentNumber(authorizedNumber)"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CountryCode } from "libphonenumber-js/max";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { storeToRefs } from "pinia";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { usePhoneCountryPolicy } from "src/composables/verification/usePhoneCountryPolicy";
import { phoneVerificationStore } from "src/stores/onboarding/phone";
import type { PhoneAuthPurpose } from "src/utils/auth/phoneAuthMode";
import { parsePhoneNumberInput } from "src/utils/auth/phoneNumberInput";
import { processEnv } from "src/utils/processEnv";
import { computed, reactive, ref } from "vue";

import ZKGradientButton from "../ui-library/ZKGradientButton.vue";
import ZKPhoneNumberInput from "../ui-library/ZKPhoneNumberInput.vue";
import PhoneAuthUnavailableNotice from "./PhoneAuthUnavailableNotice.vue";
import {
  type PhoneInputFormTranslations,
  phoneInputFormTranslations,
} from "./PhoneInputForm.i18n";
import PhoneTurnstile from "./PhoneTurnstile.vue";

const props = defineProps<{
  purpose: PhoneAuthPurpose;
}>();
const emit = defineEmits<{
  submit: [];
}>();

const { t } = useComponentI18n<PhoneInputFormTranslations>(
  phoneInputFormTranslations
);

interface PhoneInputState {
  phoneNumber: string | null;
  countryCode: CountryCode | null;
  isValid: boolean;
  hasError: boolean;
  errorMessage: string;
  hasAttemptedSubmission: boolean;
}

const phoneData = reactive<PhoneInputState>({
  phoneNumber: null,
  countryCode: null,
  isValid: false,
  hasError: false,
  errorMessage: "",
  hasAttemptedSubmission: false,
});

const { verificationPhoneNumber } = storeToRefs(phoneVerificationStore());
const countryPolicy = usePhoneCountryPolicy();
const phoneAuthAvailability = computed(() =>
  countryPolicy.availabilityForPurpose(props.purpose)
);
const allowedCountries = computed(() =>
  countryPolicy.countriesFor(props.purpose)
);
const turnstileWidget = ref<InstanceType<typeof PhoneTurnstile>>();

interface PhoneNumber {
  fullNumber: string;
}

const devAuthorizedNumbers: PhoneNumber[] = [];
loadDevAuthorizedNumbers();

function loadDevAuthorizedNumbers() {
  if (processEnv.VITE_DEV_AUTHORIZED_PHONES) {
    const phoneList = processEnv.VITE_DEV_AUTHORIZED_PHONES.split(",");
    phoneList.forEach((number) => {
      const parsedNumber = parsePhoneNumberFromString(number);
      if (parsedNumber) {
        devAuthorizedNumbers.push({
          fullNumber: parsedNumber.number,
        });
      } else {
        console.warn("Failed to parse development phone number");
      }
    });
  }
}

function clearErrors() {
  phoneData.hasError = false;
  phoneData.errorMessage = "";
}

function setError(message: string) {
  phoneData.hasError = true;
  phoneData.errorMessage = message;
}

function parsePhoneInput() {
  phoneData.isValid = false;
  const parsed = parsePhoneNumberInput({
    phoneNumber: phoneData.phoneNumber,
    defaultCountry: phoneData.countryCode,
    availabilityForCountry: (country) =>
      countryPolicy.availabilityFor({ purpose: props.purpose, country }),
  });
  if (!parsed.success) {
    const messages = {
      missing_number: t("pleaseEnterPhoneNumber"),
      invalid_number: t("pleaseEnterValidPhone"),
      unsupported_country: t("countryNotSupported"),
      registration_unavailable: t("countryRegistrationUnavailable"),
      unsupported_type: t("phoneTypeNotSupported"),
    };
    setError(messages[parsed.error]);
    return undefined;
  }

  clearErrors();
  phoneData.isValid = true;
  return parsed.phoneNumber;
}

function onPhoneUpdate() {
  phoneData.hasAttemptedSubmission = false;
  clearErrors();
  parsePhoneInput();
}

function onCountryCodeUpdate(_countryCode: CountryCode | null | undefined) {
  phoneData.hasAttemptedSubmission = false;
}

function injectDevelopmentNumber(phoneItem: PhoneNumber) {
  const parsedNumber = parsePhoneNumberFromString(phoneItem.fullNumber);
  if (parsedNumber) {
    phoneData.phoneNumber = parsedNumber.nationalNumber;
    phoneData.countryCode = parsedNumber.country || null;
    submit();
  }
}

function submit(): boolean {
  if (!phoneAuthAvailability.value.available) {
    return false;
  }

  phoneData.hasAttemptedSubmission = true;

  const parsed = parsePhoneInput();
  if (parsed === undefined) return false;
  verificationPhoneNumber.value = parsed;
  emit("submit");
  return true;
}

function takeTurnstileToken(): string | undefined {
  return turnstileWidget.value?.takeToken();
}

defineExpose({ submit, takeTurnstileToken });
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.developmentSection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 15px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.error-icon {
  font-size: 1rem;
  color: #dc2626;
}
</style>
