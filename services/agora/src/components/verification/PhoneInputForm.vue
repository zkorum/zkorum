<template>
  <div class="container">
    <PhoneAuthUnavailableNotice
      v-if="!phoneAuthAvailability.available"
      :reason="phoneAuthAvailability.reason"
    />

    <PhoneAuthUnavailableNotice
      v-else-if="countryPolicy.isError.value && !countryPolicy.isReady.value"
      reason="technical_unavailable"
    />
    <div
      v-else-if="!countryPolicy.isReady.value"
      class="row justify-center q-pa-md"
    >
      <q-spinner />
    </div>
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
import type { MazInputPhoneNumberData } from "maz-ui/components/MazInputPhoneNumber";
import { storeToRefs } from "pinia";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { usePhoneCountryPolicy } from "src/composables/verification/usePhoneCountryPolicy";
import { zodSupportedCountryCallingCode } from "src/shared/types/zod";
import { isPhoneNumberTypeSupported } from "src/shared-app-api/phone";
import { phoneVerificationStore } from "src/stores/onboarding/phone";
import {
  type PhoneAuthPurpose,
  usePhoneAuthAvailability,
} from "src/utils/auth/phoneAuthMode";
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

const phoneData = reactive({
  phoneNumber: null as string | null,
  countryCode: null as CountryCode | null,
  isValid: false,
  hasError: false,
  errorMessage: "",
  hasAttemptedSubmission: false,
});

const { verificationPhoneNumber } = storeToRefs(phoneVerificationStore());
const phoneAuthAvailability = usePhoneAuthAvailability(() => props.purpose);
const countryPolicy = usePhoneCountryPolicy();
const allowedCountries = computed(() =>
  countryPolicy.countriesFor(props.purpose)
);
const turnstileWidget = ref<InstanceType<typeof PhoneTurnstile>>();

interface PhoneNumber {
  fullNumber: string;
  countryCallingCode: string;
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
          countryCallingCode: parsedNumber.countryCallingCode,
        });
      } else {
        console.warn(
          "Failed to parse development number from string: " + number
        );
      }
    });
  }
}

const lastMazResults = ref<MazInputPhoneNumberData | null>(null);

function clearErrors() {
  phoneData.hasError = false;
  phoneData.errorMessage = "";
}

function setError(message: string) {
  phoneData.hasError = true;
  phoneData.errorMessage = message;
}

function countryUnavailableMessage(country: CountryCode | undefined): string {
  return props.purpose !== "login" &&
    country !== undefined &&
    countryPolicy.countriesFor("login").includes(country)
    ? t("countryRegistrationUnavailable")
    : t("countryNotSupported");
}

function validateFromMazResults(results: MazInputPhoneNumberData) {
  if (!results.isValid || !results.countryCallingCode) {
    phoneData.isValid = false;
    return;
  }

  const callingCode = zodSupportedCountryCallingCode.safeParse(
    results.countryCallingCode
  );
  if (!callingCode.success) {
    phoneData.isValid = false;
    phoneData.hasError = true;
    phoneData.errorMessage = t("countryNotSupported");
    return;
  }

  const country =
    results.e164 === undefined
      ? undefined
      : parsePhoneNumberFromString(results.e164)?.country;
  if (
    !countryPolicy.availabilityFor({ purpose: props.purpose, country })
      .available
  ) {
    phoneData.isValid = false;
    phoneData.hasError = true;
    phoneData.errorMessage = countryUnavailableMessage(country);
    return;
  }

  if (!isPhoneNumberTypeSupported(results.type)) {
    phoneData.isValid = false;
    phoneData.hasError = true;
    phoneData.errorMessage = t("phoneTypeNotSupported");
    return;
  }

  clearErrors();
  phoneData.isValid = true;
}

function onPhoneUpdate(results: MazInputPhoneNumberData) {
  lastMazResults.value = results;
  phoneData.hasAttemptedSubmission = false;
  clearErrors();
  validateFromMazResults(results);
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

  if (!lastMazResults.value || !phoneData.phoneNumber) {
    setError(t("pleaseEnterPhoneNumber"));
    return false;
  }

  const results = lastMazResults.value;

  if (!results.isValid || !results.e164 || !results.countryCallingCode) {
    setError(t("pleaseEnterValidPhone"));
    return false;
  }

  const callingCode = zodSupportedCountryCallingCode.safeParse(
    results.countryCallingCode
  );
  if (!callingCode.success) {
    setError(t("countryNotSupported"));
    return false;
  }

  if (
    !countryPolicy.availabilityFor({
      purpose: props.purpose,
      country: parsePhoneNumberFromString(results.e164)?.country,
    }).available
  ) {
    setError(
      countryUnavailableMessage(
        parsePhoneNumberFromString(results.e164)?.country
      )
    );
    return false;
  }

  if (!isPhoneNumberTypeSupported(results.type)) {
    setError(t("phoneTypeNotSupported"));
    return false;
  }

  verificationPhoneNumber.value = {
    countryCallingCode: callingCode.data,
    internationalPhoneNumber: results.e164,
  };
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
