import { storeToRefs } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { useBackendAuthApi, type AuthenticateReturn } from "src/utils/api/auth";

interface RequestCodeProps {
  isRequestingNewCode: boolean;
  phoneNumber: string;
  defaultCallingCode: string;
}

export function useBackendPhoneVerification() {
  const { smsCode, sendSmsCode } = useBackendAuthApi();

  const { isAuthenticated } = storeToRefs(useAuthenticationStore());

  async function submitCode(code: number): Promise<boolean> {
    if (process.env.VITE_USE_DUMMY_ACCESS == "true") {
      code = 0;
    }

    const response = await smsCode(code);
    if (response.data?.success) {
      isAuthenticated.value = true;
      return true;
      //TODO: cast to 200 DTO and parse data
    } else {
      // TODO: cast to expected DTO and switch the possible enum errors
      console.log(response.error);
      if (response.error == "already_logged_in") {
        console.log("User is already logged in");
        return false;
      } else {
        console.log("Failed to submit phone verification code");
        return false;
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
