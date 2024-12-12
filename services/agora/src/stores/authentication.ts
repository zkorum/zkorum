import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthenticationStore = defineStore("authentication", () => {

  const verificationPhoneNumber = useStorage("verification_phone_number", "");
  const verificationDefaultCallingCode = useStorage("verification_default_calling_code", "");
  const isAuthenticated = ref(false);

  return {
    isAuthenticated,
    verificationPhoneNumber,
    verificationDefaultCallingCode,
  };
});
