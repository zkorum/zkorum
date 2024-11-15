import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export const useAuthenticationStore = defineStore("authentication", () => {

  const verificationEmailAddress = useStorage("verification_email_address", "");
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
