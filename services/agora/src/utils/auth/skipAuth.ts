import { useAuthenticationStore } from "src/stores/authentication";
import { useRouter } from "vue-router";
import { useBackendPhoneVerification } from "../api/phoneVerification";

export function useSkipAuth() {

  const finalRouteName = "onboarding-step4-username";

  const router = useRouter();
  const {
    isAuthenticated,
    verificationPhoneNumber,
    verificationDefaultCallingCode,
  } = useAuthenticationStore();
  const phoneVerification = useBackendPhoneVerification();

  async function skipEverything() {
    verificationPhoneNumber.value = "+33612345678";
    verificationDefaultCallingCode.value = "33";

    const requestCodeResponse = await phoneVerification.requestCode({
      isRequestingNewCode: false,
      phoneNumber: verificationPhoneNumber.value,
      defaultCallingCode: verificationDefaultCallingCode.value,
    });
    if (requestCodeResponse.isSuccessful) {
      await phoneVerification.submitCode(0);
      isAuthenticated.value = true;
      router.push({ name: finalRouteName });
    } else {
      console.log("Failed to request code");
      if (requestCodeResponse.error == "already_logged_in") {
        console.log("Already logged in");
        isAuthenticated.value = true;
        router.push({ name: finalRouteName });
      } else if (requestCodeResponse.error == "throttled") {
        console.log("Throttled please try again later");
      }
    }
  }

  return { skipEverything }

}
