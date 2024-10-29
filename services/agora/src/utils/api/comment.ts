import { api } from "src/boot/axios";
import axios from "axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { ApiV1CommentCreatePostRequest, ApiV1CommentFetchPostRequest, DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { useCommonApi } from "./common";

export function useBackendCommentApi() {

  const { buildEncodedUcan } = useCommonApi();

  async function fetchCommentsForPost(postSlugId: string) {
    try {
      const params: ApiV1CommentFetchPostRequest = {
        postSlugId: postSlugId
      };

      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1CommentFetchPost(params, {
      });

      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw e;
      } else {
        throw e;
      }
    }
  }

  async function createNewComment(commentBody: string, postSlugId: string) {
    try {
      const params: ApiV1CommentCreatePostRequest = {
        commentBody: commentBody,
        postSlugId: postSlugId
      };

      const { url, options } = await DefaultApiAxiosParamCreator().apiV1CommentCreatePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1CommentCreatePost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan)
        }
      });

      return response.data;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw e;
      } else {
        throw e;
      }
    }
  }

  return { createNewComment, fetchCommentsForPost };
}
