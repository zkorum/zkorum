import {
  DefaultApiAxiosParamCreator,
  DefaultApiFactory,
  type ApiV1UserFetchUserCommentsPostRequest,
  type ApiV1UserFetchUserPostsPostRequest,
} from "src/api";
import { api } from "boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { useCommonApi } from "./common";
import type { ExtendedComment, ExtendedPost } from "src/shared/types/zod";
import { useBackendPostApi } from "./post";
import { useNotify } from "../ui/notify";

export function useBackendUserApi() {
  const { buildEncodedUcan } = useCommonApi();
  const { createInternalPostData } = useBackendPostApi();

  const { showNotifyMessage } = useNotify();

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
      showNotifyMessage("Failed to fetch user's personal profile.");
      return undefined;
    }
  }

  async function fetchUserPosts(
    lastPostSlugId: string | undefined
  ): Promise<ExtendedPost[]> {
    try {
      const params: ApiV1UserFetchUserPostsPostRequest = {
        lastPostSlugId: lastPostSlugId,
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

      const internalPostList: ExtendedPost[] = response.data.map(
        (postElement) => {
          const dataItem: ExtendedPost = createInternalPostData(postElement);
          return dataItem;
        }
      );

      return internalPostList;
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to fetch user's personal votes.");
      return undefined;
    }
  }

  async function fetchUserComments(
    lastCommentSlugId: string | undefined
  ): Promise<ExtendedComment[]> {
    try {
      const params: ApiV1UserFetchUserCommentsPostRequest = {
        lastCommentSlugId: lastCommentSlugId,
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1UserFetchUserCommentsPost(
          params
        );
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1UserFetchUserCommentsPost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan),
        },
      });

      const extendedCommentList: ExtendedComment[] = [];
      response.data.forEach((responseItem) => {
        const extendedComment: ExtendedComment = {
          postData: createInternalPostData(responseItem.postData),
          commentItem: {
            comment: responseItem.commentItem.comment,
            commentSlugId: responseItem.commentItem.commentSlugId,
            createdAt: new Date(responseItem.commentItem.createdAt),
            numDislikes: responseItem.commentItem.numDislikes,
            numLikes: responseItem.commentItem.numLikes,
            updatedAt: new Date(responseItem.commentItem.updatedAt),
            userName: responseItem.commentItem.userName,
          },
        };
        extendedCommentList.push(extendedComment);
      });

      return extendedCommentList;
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to fetch user's personal comments.");
      return undefined;
    }
  }

  return { fetchUserProfile, fetchUserPosts, fetchUserComments };
}
