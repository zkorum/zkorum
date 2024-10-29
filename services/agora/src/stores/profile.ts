import { defineStore } from "pinia";
import {
  DummyCommentFormat,
  PossibleCommentRankingActions,
  usePostStore,
} from "./post";

export interface UserCommentHistoryitem {
  commentItem: DummyCommentFormat;
  postSlugId: string;
  title: string;
  authorName: string;
  createdAt: Date;
  isRanked: boolean;
  rankedAction: PossibleCommentRankingActions;
}

export const useProfileStore = defineStore("profile", () => {
  const { fetchCuratedPosts } = usePostStore();
  const commentList: UserCommentHistoryitem[] = [];

  const curatedPosts = fetchCuratedPosts("", 10);

  for (let i = 0; i < curatedPosts.length; i++) {
    const curatedItem = curatedPosts[i];

    const commentItem: UserCommentHistoryitem = {
      commentItem: {
        index: 0,
        createdAt: new Date(),
        comment:
          "Dummy user comment " +
          i +
          ". At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.",
        numUpvotes: 20,
        numDownvotes: 10,
        slugId: "comment-slug-id-" + i,
      },
      postSlugId: curatedItem.metadata.slugId,
      title: curatedItem.payload.title,
      authorName: curatedItem.metadata.posterName,
      createdAt: curatedItem.metadata.createdAt,
      isRanked: false,
      rankedAction: "pass",
    };

    commentList.push(commentItem);
  }

  return { commentList };
});
