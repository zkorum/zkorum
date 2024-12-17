import { api } from "boot/axios";
import {
  DefaultApiFactory,
  type ApiV1AccountSubmitUsernameChangePostRequest,
} from "src/api";
import { useNotify } from "../ui/notify";

export function useBackendOnboardingApi() {

  const { showNotifyMessage } = useNotify();

  async function isUsernameInUse(username: string): Promise<boolean | null> {
    try {
      const params: ApiV1AccountSubmitUsernameChangePostRequest = {
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
