import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "../crypto/ucan/operation";
import {
  ApiV1FeedFetchMorePost200ResponseInner,
  ApiV1FeedFetchMorePostRequest,
  ApiV1PostCreatePostRequest,
  ApiV1PostFetchPostRequest,
  DefaultApiAxiosParamCreator,
  DefaultApiFactory,
} from "src/api";
import { useCommonApi } from "./common";
import {
  DummyPollOptionFormat,
  DummyPostDataFormat,
  PossibleCommentRankingActions,
} from "src/stores/post";
import { useNotify } from "../ui/notify";
import { useRouter } from "vue-router";
import axios from "axios";
import { useBackendPollApi } from "./poll";

export function useBackendPostApi() {

  const { buildEncodedUcan } = useCommonApi();
  const { fetchUserPollResponse } = useBackendPollApi();

  const { showNotifyMessage } = useNotify();

  const router = useRouter();

  async function createInternalPostData(
    postElement: ApiV1FeedFetchMorePost200ResponseInner
  ) {

    // Create the polling object
    const pollOptionList: DummyPollOptionFormat[] = [];
    postElement.payload.poll?.forEach(pollOption => {
      const internalItem: DummyPollOptionFormat = {
        index: pollOption.optionNumber - 1,
        numResponses: pollOption.numResponses,
        option: pollOption.optionTitle
      };
      pollOptionList.push(internalItem);
    });

    // Load user's polling response
    let pollResponseOption: number | undefined = 0;
    if (postElement.payload.poll) {
      const pollResponse = await fetchUserPollResponse(postElement.metadata.postSlugId);
      pollResponseOption = pollResponse?.selectedPollOption;
    }

    const newItem: DummyPostDataFormat = {
      metadata: {
        commentCount: postElement.metadata.commentCount,
        communityId: "",
        createdAt: new Date(postElement.metadata.createdAt),
        isHidden: false,
        posterImagePath: "/icons/favicon-128x128.png",
        posterName: "COMPANY NAME",
        slugId: postElement.metadata.postSlugId,
        uid: "",
      },
      payload: {
        body: postElement.payload.body || "",
        comments: [],
        poll: {
          hasPoll: postElement.payload.poll ? true : false,
          options: pollOptionList,
        },
        title: postElement.payload.title,
      },
      userInteraction: {
        pollResponse: {
          hadResponded: pollResponseOption != undefined,
          responseIndex: pollResponseOption ?? 0
        },
        commentRanking: {
          assignedRankingItems: [],
          rankedCommentList: new Map<number, PossibleCommentRankingActions>(),
        }
      },
    };

    return newItem;
  }

  async function fetchPostBySlugId(postSlugId: string) {
    try {
      const params: ApiV1PostFetchPostRequest = {
        postSlugId: postSlugId,
      };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1PostFetchPost(params, {});
      return await createInternalPostData(response.data.postData);
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

  async function fetchRecentPost() {
    try {
      const params: ApiV1FeedFetchMorePostRequest = {
        showHidden: false,
        lastReactedAt: undefined,
      };
      const response = await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1FeedFetchRecentPost(params, {});

      const dataList: DummyPostDataFormat[] = [];

      await Promise.all(response.data.map(async (postElement) => {
        const dataItem = await createInternalPostData(postElement);
        dataList.push(dataItem);
      }));

      dataList.sort(function (a, b) {
        return b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime();
      });

      return dataList;
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
        pollingOptionList: pollingOptionList
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

  return { createNewPost, fetchRecentPost, fetchPostBySlugId };
}
