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
  onMounted(() => {
    loadPostData(false);
  });

  const lastSavedHomeFeedPosition = useStorage(
    "last-saved-home-feed-position",
    0
  );

  async function loadPostData(loadMoreData: boolean) {

    let createdAtThreshold = new Date();

    if (loadMoreData) {
      const lastPostItem = masterPostDataList.value.at(-1);
      if (lastPostItem) {
        createdAtThreshold = new Date(lastPostItem.metadata.createdAt);
      }
    }

    const response = await fetchRecentPost(createdAtThreshold.toISOString());

    if (response != null) {
      if (response.length == 0) {
        endOfFeed.value = true;
      }

      if (loadMoreData) {
        masterPostDataList.value.push(...response);
      } else {
        masterPostDataList.value = response;
      }

      dataReady.value = true;
    } else {
      dataReady.value = false;
    }
  }

  function allocateAllCommentsForRanking(postSlugId: string) {
    const postItem = getPostBySlugId(postSlugId);
    postItem.userInteraction.commentRanking.assignedRankingItems = [];
    for (let i = 0; i < postItem.payload.comments.length; i++) {
      postItem.userInteraction.commentRanking.assignedRankingItems.push(i);
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

  function updateCommentRanking(
    postSlugId: string,
    commentIndex: number,
    rankingAction: PossibleCommentRankingActions
  ) {
    const post = getPostBySlugId(postSlugId);
    const rankedCommentMap =
      post.userInteraction.commentRanking.rankedCommentList;
    const currentAction = rankedCommentMap.get(commentIndex);

    let upvoteDiff = 0;
    let downvoteDiff = 0;

    if (currentAction != undefined && rankingAction != "pass") {
      if (currentAction == "like") {
        if (rankingAction == "like") {
          rankedCommentMap.delete(commentIndex);
          upvoteDiff -= 1;
        } else if (rankingAction == "dislike") {
          rankedCommentMap.set(commentIndex, "dislike");
          upvoteDiff -= 1;
          downvoteDiff += 1;
        } else {
          console.log("Invalid state");
        }
      } else if (currentAction == "dislike") {
        if (rankingAction == "like") {
          rankedCommentMap.set(commentIndex, "like");
          upvoteDiff += 1;
          downvoteDiff -= 1;
        } else if (rankingAction == "dislike") {
          rankedCommentMap.delete(commentIndex);
          downvoteDiff -= 1;
        } else {
          console.log("Invalid state");
        }
      }
    } else {
      if (rankingAction == "like") {
        rankedCommentMap.set(commentIndex, "like");
        upvoteDiff += 1;
      } else if (rankingAction == "dislike") {
        rankedCommentMap.set(commentIndex, "dislike");
        downvoteDiff += 1;
      } else {
        rankedCommentMap.set(commentIndex, "pass");
      }
    }

    for (let i = 0; i < post.payload.comments.length; i++) {
      const commentItem = post.payload.comments[i];
      if (commentItem.index == commentIndex) {
        commentItem.numUpvotes += upvoteDiff;
        commentItem.numDownvotes += downvoteDiff;
        break;
      }
    }
  }

  return {
    getPostBySlugId,
    masterPostDataList,
    updateCommentRanking,
    allocateAllCommentsForRanking,
    loadPostData,
    emptyPost,
    lastSavedHomeFeedPosition,
    dataReady,
    endOfFeed
  };
});
