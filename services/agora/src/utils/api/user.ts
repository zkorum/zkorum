import { DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { useDialog } from "../ui/dialog";
import { useCommonApi } from "./common";
import { useBackendPostApi } from "./post";
import type { ExtendedPost } from "src/shared/types/zod";

export function useBackendUserApi() {
  const { buildEncodedUcan } = useCommonApi();
  const { createInternalPostData } = useBackendPostApi();

  const { showMessage } = useDialog();

  async function fetchUserProfile() {
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

      const internalPostList: ExtendedPost[] = response.data.userPostList.map((postElement) => {
        const dataItem: ExtendedPost = createInternalPostData(postElement);
        return dataItem;
      });

      return {
        commentCount: response.data.commentCount,
        postCount: response.data.postCount,
        createdAt: new Date(response.data.createdAt),
        userName: response.data.userName,
        userPostList: internalPostList
      };
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to fetch user's personal votes.");
      return undefined;
    }
  }


  return { fetchUserProfile };
}
