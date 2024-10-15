import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import { useAuthenticationStore } from "src/stores/authentication";
import { useBackendAuthApi } from "src/utils/api/auth";
import { getPlatform } from "src/utils/common";
import { useRouter } from "vue-router";

export function useEmailVerification() {

  const { emailCode, sendEmailCode } = useBackendAuthApi();

  const { isAuthenticated } = storeToRefs(useAuthenticationStore());

  const $q = useQuasar();
  const router = useRouter();

  async function submitCode(code: number, emailAddress: string) {

    if (process.env.USE_DUMMY_ACCESS == "true") {
      emailAddress = "test@gmail.com";
    }

    if (process.env.USE_DUMMY_ACCESS == "true") {
      code = 0;
    }

    const response = await emailCode(emailAddress, code, getPlatform($q.platform));
    if (response.data.success) {
      isAuthenticated.value = true;
      router.push({ name: "verification-options" });
    } else {
      console.log("Failed to submit email verification code");
      console.log(response.data.reason);
    }
  }

  async function requestCode(isRequestingNewCode: boolean, emailAddress: string) {

    if (process.env.USE_DUMMY_ACCESS == "true") {
      emailAddress = "test@gmail.com";
    }

    const response = await sendEmailCode(emailAddress, isRequestingNewCode, getPlatform($q.platform));
    return response;
  }

  return { submitCode, requestCode };

}
