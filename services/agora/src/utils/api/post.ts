import { api } from "src/boot/axios";
import axios from "axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { ApiV1FeedFetchMorePostRequest, ApiV1PostCreatePost200Response, ApiV1PostCreatePostRequest, DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { useCommonApi } from "./common";

export function useBackendPostApi() {

  const { buildEncodedUcan } = useCommonApi();

  async function fetchRecentPost() {
    try {
      const params: ApiV1FeedFetchMorePostRequest = {
        showHidden: false,
        lastReactedAt: undefined
      };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1FeedFetchRecentPost(params, {
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

  async function createNewPost(postTitle: string, postBody: string
  ): Promise<ApiV1PostCreatePost200Response> {
    try {
      const params: ApiV1PostCreatePostRequest = {
        postTitle: postTitle,
        postBody: postBody
      };
      const { url, options } = await DefaultApiAxiosParamCreator().apiV1PostCreatePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PostCreatePost(params, {
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

  return { createNewPost, fetchRecentPost };
}
