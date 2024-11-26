import { useStorage } from "@vueuse/core";
import { usePostStore } from "./post";

export function useAuthenticationStore() {

  const verificationPhoneNumber = useStorage("verification_phone_number", "");
  const verificationDefaultCallingCode = useStorage("verification_default_calling_code", "");
  const isAuthenticated = useStorage("is_authenticated", false);

  const { resetPostData } = usePostStore();

  function userLogout() {
    isAuthenticated.value = false;
    resetPostData();
  }

  return {
    isAuthenticated,
    verificationPhoneNumber,
    verificationDefaultCallingCode,
    userLogout,
  };
}
