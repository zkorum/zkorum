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
import { useDialog } from "../ui/dialog";

export function useBackendPostApi() {

  const { buildEncodedUcan } = useCommonApi();

  const { showMessage } = useDialog();

  function createInternalPostData(
    postElement: ApiV1FeedFetchMorePost200ResponseInner
  ) {

    const pollOptionList: DummyPollOptionFormat[] = [];
    postElement.payload.poll?.forEach(pollOption => {
      const internalItem: DummyPollOptionFormat = {
        index: pollOption.index,
        numResponses: pollOption.numResponses,
        option: pollOption.option
      };
      pollOptionList.push(internalItem);
    });

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
        commentRanking: {
          assignedRankingItems: [],
          rankedCommentList: new Map<number, PossibleCommentRankingActions>(),
        },
        pollVoting: {
          hasVoted: false,
          voteIndex: 0,
        },
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
      return createInternalPostData(response.data.postData);
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to fetch post by slug ID.");
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
      response.data.forEach((postElement) => {
        const dataItem = createInternalPostData(postElement);
        dataList.push(dataItem);
      });

      return dataList;
    } catch (e) {
      console.error(e);
      showMessage("An error had occured", "Failed to fetch recent posts from the server.");
      return null;
    }
  }

  async function createNewPost(
    postTitle: string,
    postBody: string | undefined,
    pollingOptionList: string[] | undefined
  ) {

    console.log(pollingOptionList);

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
      showMessage("An error had occured", "The server had failed to create the post.");
      return null;
    }
  }

  return { createNewPost, fetchRecentPost, fetchPostBySlugId };
}
