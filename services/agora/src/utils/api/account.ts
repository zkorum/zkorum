import { api } from "boot/axios";
import {
  DefaultApiAxiosParamCreator,
  DefaultApiFactory,
  type ApiV1AccountSubmitUsernameChangePostRequest,
} from "src/api";
import { useNotify } from "../ui/notify";
import { useCommonApi } from "./common";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { usePostStore } from "src/stores/post";

export function useBackendAccountApi() {
  const { buildEncodedUcan } = useCommonApi();

  const { loadPostData } = usePostStore();

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
      await loadPostData(false);
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

  async function isUsernameInUse(username: string): Promise<boolean | null> {
    try {
      const params: ApiV1AccountSubmitUsernameChangePostRequest = {
        username: username
      }

      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AccountIsUsernameInUsePost(params);
      return response.data;

    } catch (e) {
      console.error(e);
      showNotifyMessage("Error while checking if the username is in use.");
      return true;
    }
  }

  async function generateUnusedRandomUsername(): Promise<string | null> {
    try {
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AccountGenerateUnusedRandomUsernamePost();
      return response.data;
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to generate random username");
      return null;
    }
  }

  return {
    deleteUserAccount,
    submitUsernameChange,
    isUsernameInUse,
    generateUnusedRandomUsername
  };
}
