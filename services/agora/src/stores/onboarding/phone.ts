import { defineStore } from "pinia";
import type { SupportedCountryCallingCode } from "src/shared/types/zod";
import { ref } from "vue";

export interface PhoneVerificationData {
  readonly internationalPhoneNumber: string;
  readonly countryCallingCode: SupportedCountryCallingCode;
}

export const phoneVerificationStore = defineStore("phoneVerification", () => {
  const EMPTY_NUMBER: PhoneVerificationData = {
    internationalPhoneNumber: "",
    countryCallingCode: "33",
  };

  const verificationPhoneNumber = ref(EMPTY_NUMBER);
  const requestCodeThrottleUntil = ref<Date | null>(null);
  const pendingOtpData = ref<{
    codeExpiry: Date;
    nextCodeSoonestTime: Date;
  } | null>(null);

  function reset(): void {
    verificationPhoneNumber.value = { ...EMPTY_NUMBER };
    requestCodeThrottleUntil.value = null;
    pendingOtpData.value = null;
  }

  return {
    verificationPhoneNumber,
    requestCodeThrottleUntil,
    pendingOtpData,
    reset,
  };
});
