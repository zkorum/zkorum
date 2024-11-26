import { DefaultApiAxiosParamCreator, DefaultApiFactory, type ApiV1UserFetchUserPostsPostRequest } from "src/api";
import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { useDialog } from "../ui/dialog";
import { useCommonApi } from "./common";
import type { ExtendedPost } from "src/shared/types/zod";
import { useBackendPostApi } from "./post";

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

      return {
        commentCount: response.data.commentCount,
        postCount: response.data.postCount,
        createdAt: new Date(response.data.createdAt),
        userName: response.data.userName,
      };
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to fetch user's personal votes.");
      return undefined;
    }
  }

  async function fetchUserPosts(lastPostSlugId: string | undefined): Promise<ExtendedPost[]> {
    try {
      const params: ApiV1UserFetchUserPostsPostRequest = {
        lastPostSlugId: lastPostSlugId
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1UserFetchUserPostsPost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1UserFetchUserPostsPost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan),
        },
      });

      const internalPostList: ExtendedPost[] = response.data.map((postElement) => {
        const dataItem: ExtendedPost = createInternalPostData(postElement);
        return dataItem;
      });

      return internalPostList;
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to fetch user's personal votes.");
      return undefined;
    }
  }

  return { fetchUserProfile, fetchUserPosts };
}
