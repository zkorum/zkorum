import { defineStore } from "pinia";
import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import { useBackendPostApi } from "src/utils/api/post";
import { useAuthenticationStore } from "./authentication";

export interface DummyPollOptionFormat {
  index: number;
  option: string;
  numResponses: number;
}

export interface DummyCommentFormat {
  index: number;
  createdAt: Date;
  comment: string;
  numUpvotes: number;
  numDownvotes: number;
  slugId: string;
}

export interface DummyPostMetadataFormat {
  uid: string;
  slugId: string;
  isHidden: boolean;
  createdAt: string;
  commentCount: number;
  communityId: string;
  posterName: string;
  posterImagePath: string;
}

export interface DummyPostUserVote {
  hasVoted: boolean;
  voteIndex: number;
}

export type PossibleCommentRankingActions = "like" | "dislike" | "pass";

export interface UserRankedCommentItem {
  index: number;
  action: PossibleCommentRankingActions;
}

export interface DummyCommentRankingFormat {
  rankedCommentList: Map<number, PossibleCommentRankingActions>;
  assignedRankingItems: number[];
}

export interface DummyUserPollResponse {
  hadResponded: boolean;
  responseIndex: number;
}

export interface DummyPostDataFormat {
  metadata: DummyPostMetadataFormat;
  payload: {
    title: string;
    body: string;
    poll: {
      hasPoll: boolean;
      options: DummyPollOptionFormat[];
    };
    comments: DummyCommentFormat[];
  };
  userInteraction: {
    pollResponse: DummyUserPollResponse;
    commentRanking: DummyCommentRankingFormat;
  };
}

export interface DummyUserPostDataFormat {
  slugId: string;
  poll: {
    castedVote: boolean;
    votedIndex: number;
  };
  comment: { ratedIndexList: number[] };
}

export const usePostStore = defineStore("post", () => {
  const { fetchRecentPost } = useBackendPostApi();
  const { isAuthenticated } = useAuthenticationStore();

  const dataReady = ref(false);
  const endOfFeed = ref(false);

  const emptyPost: DummyPostDataFormat = {
    metadata: {
      uid: "",
      slugId: "",
      isHidden: false,
      createdAt: new Date().toString(),
      commentCount: 0,
      communityId: "",
      posterName: "",
      posterImagePath: "",
    },
    payload: {
      title: "",
      body: "",
      poll: {
        hasPoll: false,
        options: [],
      },
      comments: [],
    },
    userInteraction: {
      pollResponse: {
        hadResponded: false,
        responseIndex: 0
      },
      commentRanking: {
        rankedCommentList: new Map(),
        assignedRankingItems: [],
      },
    },
  };

  const masterPostDataList = ref<DummyPostDataFormat[]>([emptyPost, emptyPost, emptyPost, emptyPost]);

  const lastSavedHomeFeedPosition = useStorage(
    "last-saved-home-feed-position",
    0
  );

  async function loadPostData(loadMoreData: boolean) {
    let lastSlugId: undefined | string = undefined;

    if (loadMoreData) {
      const lastPostItem = masterPostDataList.value.at(-1);
      if (lastPostItem) {
        lastSlugId = lastPostItem.metadata.slugId;
      }
    }

    const response = await fetchRecentPost(lastSlugId, isAuthenticated);

    if (response != null) {
      if (response.length == 0) {
        if (loadMoreData) {
          endOfFeed.value = true;
        } else {
          masterPostDataList.value = [];
          endOfFeed.value = false;
        }
      } else {
        endOfFeed.value = false;

        if (loadMoreData) {
          masterPostDataList.value.push(...response);
          trimHomeFeedSize(60);
        } else {
          masterPostDataList.value = response;
        }
      }

      dataReady.value = true;
    } else {
      dataReady.value = false;
    }
  }

  function trimHomeFeedSize(targetPostSize: number) {
    if (masterPostDataList.value.length > targetPostSize) {
      masterPostDataList.value = masterPostDataList.value.slice(masterPostDataList.value.length - targetPostSize);
    }
  }

  async function hasNewPosts() {
    const response = await fetchRecentPost(undefined, isAuthenticated);
    if (response != null) {
      if (response.length > 0 && masterPostDataList.value.length > 0) {
        if (response[0].metadata.createdAt != masterPostDataList.value[0].metadata.createdAt) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  function getPostBySlugId(slugId: string) {
    for (let i = 0; i < masterPostDataList.value.length; i++) {
      const postItem = masterPostDataList.value[i];
      if (slugId == postItem.metadata.slugId) {
        return postItem;
      }
    }

    return emptyPost;
  }

  function resetPostData() {
    masterPostDataList.value = [];
  }

  return {
    getPostBySlugId,
    loadPostData,
    hasNewPosts,
    resetPostData,
    masterPostDataList,
    emptyPost,
    lastSavedHomeFeedPosition,
    dataReady,
    endOfFeed
  };
});
