import { DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { useDialog } from "../ui/dialog";
import { useCommonApi } from "./common";
import { FetchUserProfileResponse } from "src/shared/types/dto";

export function useBackendUserApi() {
  const { buildEncodedUcan } = useCommonApi();

  const { showMessage } = useDialog();

  async function fetchUserProfile(): Promise<FetchUserProfileResponse | undefined> {
    try {
      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1UserFetchUserProfilePost();
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1UserFetchUserProfilePost({
        headers: {
          ...buildAuthorizationHeader(encodedUcan),
        },
      });

      return {
        commentCount: response.data.commentCount,
        postCount: response.data.postCount,
        createdAt: new Date(response.data.createdAt),
        userName: response.data.userName
      };
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to fetch user's personal votes.");
      return undefined;
    }
  }

  return { fetchUserProfile };
}
