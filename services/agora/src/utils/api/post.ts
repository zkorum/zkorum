import { api } from "src/boot/axios";
import axios from "axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import { ApiV1FeedFetchMorePost200ResponseInner, ApiV1FeedFetchMorePostRequest, ApiV1PostCreatePost200Response, ApiV1PostCreatePostRequest, ApiV1PostFetchPostRequest, DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api";
import { useCommonApi } from "./common";
import { DummyPostDataFormat, PossibleCommentRankingActions } from "src/stores/post";

export function useBackendPostApi() {

  const { buildEncodedUcan } = useCommonApi();

  function createInternalPostData(postElement: ApiV1FeedFetchMorePost200ResponseInner) {
    const newItem: DummyPostDataFormat = {
      metadata: {
        commentCount: postElement.metadata.commentCount,
        communityId: "",
        createdAt: new Date(postElement.metadata.createdAt),
        isHidden: false,
        posterImagePath: "/icons/favicon-128x128.png",
        posterName: "COMPANY NAME",
        slugId: postElement.metadata.postSlugId,
        uid: ""
      },
      payload: {
        body: postElement.payload.body || "",
        comments: [],
        poll: {
          hasPoll: false,
          options: []
        },
        title: postElement.payload.title
      },
      userInteraction: {
        commentRanking: {
          assignedRankingItems: [],
          rankedCommentList: new Map<number, PossibleCommentRankingActions>()
        },
        pollVoting: {
          hasVoted: false,
          voteIndex: 0
        }
      }
    };

    return newItem;
  }

  async function fetchPostBySlugId(postSlugId: string) {
    try {
      const params: ApiV1PostFetchPostRequest = {
        postSlugId: postSlugId
      };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PostFetchPost(params, {
      });
      return createInternalPostData(response.data.postData);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw e;
      } else {
        throw e;
      }
    }
  }

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

      const dataList: DummyPostDataFormat[] = [];
      response.data.forEach(postElement => {
        const dataItem = createInternalPostData(postElement);
        dataList.push(dataItem);
      });

      return dataList;
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

  return { createNewPost, fetchRecentPost, fetchPostBySlugId };
}
