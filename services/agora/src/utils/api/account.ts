import { api } from "boot/axios";
import {
  DefaultApiAxiosParamCreator,
  DefaultApiFactory,
  type ApiV1AccountSubmitUsernameChangePostRequest,
} from "src/api";
import { useNotify } from "../ui/notify";
import { useCommonApi } from "./common";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";

export function useBackendAccountApi() {
  const { buildEncodedUcan } = useCommonApi();

  const { showNotifyMessage } = useNotify();

  async function submitUsernameChange(username: string): Promise<boolean> {
    try {
      const params: ApiV1AccountSubmitUsernameChangePostRequest = {
        username: username
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1AccountSubmitUsernameChangePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AccountSubmitUsernameChangePost(
        params,
        {
          headers: {
            ...buildAuthorizationHeader(encodedUcan),
          },
        }
      );
      showNotifyMessage("Username changed");
      return true;
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to change username");
      return false;
    }
  }

  async function deleteUserAccount(): Promise<boolean> {
    try {
      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1AccountDeleteUserPost();
      const encodedUcan = await buildEncodedUcan(url, options);
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AccountDeleteUserPost(
        {
          headers: {
            ...buildAuthorizationHeader(encodedUcan),
          },
        }
      );
      showNotifyMessage("Account deleted");
      return true;
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to delete user account. Please contact support for further assistance.");
      return false;
    }
  }

  return {
    deleteUserAccount,
    submitUsernameChange
  };
}
