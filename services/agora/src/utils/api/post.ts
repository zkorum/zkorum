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
import { useBackendPollApi } from "./poll";
import type { ExtendedPost } from "src/shared/types/zod";

export function useBackendPostApi() {
  const { buildEncodedUcan } = useCommonApi();
  const { fetchUserPollResponse } = useBackendPollApi();

  const { showNotifyMessage } = useNotify();

  const router = useRouter();

  async function createInternalPostData(
    postElement: ApiV1FeedFetchRecentPost200ResponsePostDataListInner,
    loadUserData: boolean
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

    // Load user's polling response
    let pollResponseOption: number | undefined = undefined;
    if (postElement.payload.poll && loadUserData) {
      const pollResponse = await fetchUserPollResponse([postElement.metadata.postSlugId]);
      pollResponseOption = pollResponse.get(postElement.metadata.postSlugId);
    }

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
      return await createInternalPostData(
        response.data.postData,
        loadUserPollResponse
      );
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

  async function fetchRecentPost(
    lastSlugId: string | undefined,
    loadUserPollData: boolean
  ) {
    try {
      const params: ApiV1FeedFetchRecentPostRequest = {
        showHidden: false,
        lastSlugId: lastSlugId,
      };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1FeedFetchRecentPost(params, {});

      const dataList: DummyPostDataFormat[] = [];

      await Promise.all(response.data.postDataList.map(async (postElement) => {
        const dataItem = await createInternalPostData(postElement, loadUserPollData);
        dataList.push(dataItem);
      }));

      dataList.sort(function (a, b) {
        return (
          new Date(b.metadata.createdAt).getTime() -
          new Date(a.metadata.createdAt).getTime()
        );
      });

      return {
        postDataList: dataList,
        reachedEndOfFeed: response.data.reachedEndOfFeed
      };
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
