import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import {
  DefaultApiAxiosParamCreator,
  DefaultApiFactory,
  type ApiV1FeedFetchRecentPost200ResponsePostDataListInner,
  type ApiV1FeedFetchRecentPostRequest,
  type ApiV1PostCreatePostRequest,
  type ApiV1PostFetchPostBySlugIdPostRequest,
} from "src/api";
import { useCommonApi } from "./common";
import {
  type DummyPollOptionFormat,
  type DummyPostDataFormat,
  type PossibleCommentRankingActions,
} from "src/stores/post";
import { useNotify } from "../ui/notify";
import { useRouter } from "vue-router";
import axios from "axios";
import type { ExtendedPost } from "src/shared/types/zod";

export function useBackendPostApi() {
  const { buildEncodedUcan } = useCommonApi();

  const { showNotifyMessage } = useNotify();

  const router = useRouter();

  function createInternalPostData(
    postElement: ApiV1FeedFetchRecentPost200ResponsePostDataListInner,
    loadUserData: boolean,
    pollResponseOption: undefined | number
  ) {
    // Create the polling object
    const pollOptionList: DummyPollOptionFormat[] = [];
    postElement.payload.poll?.forEach((pollOption) => {
      const internalItem: DummyPollOptionFormat = {
        index: pollOption.optionNumber - 1,
        numResponses: pollOption.numResponses,
        option: pollOption.optionTitle,
      };
      pollOptionList.push(internalItem);
    });

    const parseditem = composeInternalPostList([postElement])[0];

    const newItem: DummyPostDataFormat = {
      ...parseditem,
      userInteraction: {
        pollResponse: {
          hadResponded: pollResponseOption != undefined,
          responseIndex: pollResponseOption ? pollResponseOption - 1 : 0,
        },
        commentRanking: {
          assignedRankingItems: [],
          rankedCommentList: new Map<number, PossibleCommentRankingActions>(),
        }
      }
    };

    return newItem;
  };

  async function fetchPostBySlugId(
    postSlugId: string,
    loadUserPollResponse: boolean
  ) {
    try {
      const params: ApiV1PostFetchPostBySlugIdPostRequest = {
        postSlugId: postSlugId,
      };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PostFetchPostBySlugIdPost(params, {});
      return createInternalPostData(response.data.postData, loadUserPollResponse, undefined);
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        if (error.status == 400) {
          showNotifyMessage("Post resource not found.");
          router.push({ name: "default-home-feed" });
        }
      } else {
        showNotifyMessage("Failed to fetch post by slug ID.");
      }

      return null;
    }
  }

  async function fetchRecentPost(lastSlugId: string | undefined, loadUserPollData: boolean) {
    try {
      const params: ApiV1FeedFetchRecentPostRequest = {
        showHidden: false,
        lastSlugId: lastSlugId,
        isAuthenticatedRequest: loadUserPollData
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1FeedFetchRecentPost(params);
      if (!loadUserPollData) {
        const response = await DefaultApiFactory(
          undefined,
          undefined,
          api
        ).apiV1FeedFetchRecentPost(params, {});

        const dataList = response.data.postDataList.map(postItem => {
          const dataItem = createInternalPostData(postItem, loadUserPollData, undefined);
          return dataItem;
        });

        return {
          postDataList: dataList,
          reachedEndOfFeed: response.data.reachedEndOfFeed
        };
      } else {
        const encodedUcan = await buildEncodedUcan(url, options);
        const response = await DefaultApiFactory(
          undefined,
          undefined,
          api
        ).apiV1FeedFetchRecentPost(params, {
          headers: {
            ...buildAuthorizationHeader(encodedUcan),
          },
        });

        if (response.data.pollResponse) {
          const responseMap = new Map<string, number>();
          response.data.pollResponse.forEach(response => {
            responseMap.set(response.postSlugId, response.optionChosen);
          });

          const dataList = response.data.postDataList.map(postItem => {
            const dataItem = createInternalPostData(postItem, loadUserPollData, responseMap.get(postItem.metadata.postSlugId));
            return dataItem;
          });

          return {
            postDataList: dataList,
            reachedEndOfFeed: response.data.reachedEndOfFeed
          };
        } else {
          showNotifyMessage("Missing personal poll data in the feed response");
          return null;
        }

      }
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to fetch recent posts from the server.");
      return null;
    }
  }

  async function createNewPost(
    postTitle: string,
    postBody: string | undefined,
    pollingOptionList: string[] | undefined
  ) {
    try {
      const params: ApiV1PostCreatePostRequest = {
        postTitle: postTitle,
        postBody: postBody,
        pollingOptionList: pollingOptionList,
      };

      const { url, options } =
        await DefaultApiAxiosParamCreator().apiV1PostCreatePost(params);
      const encodedUcan = await buildEncodedUcan(url, options);
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PostCreatePost(params, {
        headers: {
          ...buildAuthorizationHeader(encodedUcan),
        },
      });
      return response.data;
    } catch (e) {
      console.error(e);
      showNotifyMessage("Failed to create the new post.");
      return null;
    }
  }

  function composeInternalPostList(incomingPostList: ApiV1FeedFetchRecentPost200ResponsePostDataListInner[]): ExtendedPost[] {
    const parsedList: ExtendedPost[] = [];

    incomingPostList.forEach(item => {
      const newPost: ExtendedPost = {
        metadata: {
          authorUserName: item.metadata.authorUserName,
          commentCount: item.metadata.commentCount,
          createdAt: new Date(item.metadata.createdAt),
          lastReactedAt: new Date(item.metadata.lastReactedAt),
          postSlugId: item.metadata.postSlugId,
          updatedAt: new Date(item.metadata.updatedAt),
          authorImagePath: item.metadata.authorImagePath,
          isHidden: item.metadata.isHidden
        },
        payload: {
          title: item.payload.title,
          body: item.payload.body,
          poll: item.payload.poll
        }
      };

      parsedList.push(newPost);
    });

    return parsedList;
  }

  return { createNewPost, fetchRecentPost, fetchPostBySlugId, createInternalPostData, composeInternalPostList };
}
