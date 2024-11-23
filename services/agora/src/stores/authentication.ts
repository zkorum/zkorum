import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export const useAuthenticationStore = defineStore("authentication", () => {

  const verificationPhoneNumber = useStorage("verification_phone_number", "");
  const verificationDefaultCallingCode = useStorage("verification_default_calling_code", "");
  const isAuthenticated = useStorage("is_authenticated", false);

  function userLogout() {
    isAuthenticated.value = false;
  }

  return {
    isAuthenticated,
    verificationPhoneNumber,
    verificationDefaultCallingCode,
    userLogout,
  };
});
