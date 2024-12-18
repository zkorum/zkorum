import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export const phoneVerificationStore = defineStore("phoneVerification", () => {

  interface PhoneNumberInterface {
    phoneNumber: string;
    defaultCallingCode: string;
  }

  const EMPTY_NUMBER: PhoneNumberInterface = {
    phoneNumber: "",
    defaultCallingCode: ""
  }

  const verificationPhoneNumber = useStorage("verification-phone-number", EMPTY_NUMBER);

  return { verificationPhoneNumber };
});
