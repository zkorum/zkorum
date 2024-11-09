import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { useStorage } from "@vueuse/core";
import { useBackendPostApi } from "src/utils/api/post";

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

  onMounted(() => {
    loadPostData(false);
  });

  async function loadPostData(loadMoreData: boolean) {

    let lastSlugId: undefined | string = undefined;

    if (loadMoreData) {
      const lastPostItem = masterPostDataList.value.at(-1);
      if (lastPostItem) {
        lastSlugId = lastPostItem.metadata.slugId;
      }
    }

    const response = await fetchRecentPost(lastSlugId);

    if (response != null) {
      if (response.length == 0) {
        endOfFeed.value = true;
      } else {
        endOfFeed.value = false;

        if (loadMoreData) {
          masterPostDataList.value.push(...response);
        } else {
          masterPostDataList.value = response;
        }
      }

      dataReady.value = true;
    } else {
      dataReady.value = false;
    }
  }

  async function hasNewPosts() {
    const response = await fetchRecentPost(undefined);
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

  return {
    getPostBySlugId,
    loadPostData,
    hasNewPosts,
    masterPostDataList,
    emptyPost,
    lastSavedHomeFeedPosition,
    dataReady,
    endOfFeed
  };
});
