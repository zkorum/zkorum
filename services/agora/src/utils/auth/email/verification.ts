import { useAuthenticationStore } from "src/stores/authentication";
import { useBackendAuthApi, type AuthenticateReturn } from "src/utils/api/auth";
import { useRouter } from "vue-router";

interface RequestCodeProps {
  isRequestingNewCode: boolean;
  phoneNumber: string;
  defaultCallingCode: string;
}

export function usePhoneVerification() {
  const { smsCode, sendSmsCode } = useBackendAuthApi();

  const { isAuthenticated } = useAuthenticationStore();

  const router = useRouter();

  async function submitCode(code: number) {
    if (process.env.USE_DUMMY_ACCESS == "true") {
      code = 0;
    }

    const response = await smsCode(code);
    if (response.data?.success) {
      isAuthenticated.value = true;
      //TODO: cast to 200 DTO and parse data
      router.push({ name: "verification-options" });
    } else {
      // TODO: cast to expected DTO and switch the possible enum errors
      console.log(response.error);
      if (response.error == "already_logged_in") {
        console.log("User is already logged in");
      } else {
        console.log("Failed to submit email verification code");
      }
    }
  }

  async function requestCode({
    isRequestingNewCode,
    phoneNumber,
    defaultCallingCode,
  }: RequestCodeProps): Promise<AuthenticateReturn> {
    const response = await sendSmsCode({
      phoneNumber,
      defaultCallingCode,
      isRequestingNewCode,
    });
    return response;
  }

  return { submitCode, requestCode };
}
