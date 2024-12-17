import { api } from "boot/axios";
import {
  DefaultApiFactory,
  type ApiV1OnboardingIsUsernameInUsePostRequest,
} from "src/api";
import { useNotify } from "../ui/notify";

export function useBackendOnboardingApi() {

  const { showNotifyMessage } = useNotify();

  async function isUsernameInUse(username: string): Promise<boolean | null> {
    try {
      const params: ApiV1OnboardingIsUsernameInUsePostRequest = {
        username: username
      }

      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1OnboardingIsUsernameInUsePost(params);
      return response.data;

    } catch (e) {
      console.error(e);
      showNotifyMessage("Error while checking if the username is in use.");
      return true;
    }
  }

  return {
    isUsernameInUse
  };
}
