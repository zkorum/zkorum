import { defineStore } from "pinia";
import { usePostStore } from "./post";

export interface CommentItem {
  postSlugId: string;
  title: string;
  authorName: string;
  createdAt: Date;
  numUpvotes: number;
  numDownvotes: number;
  userComment: string;
  commentSlugId: string;
}

export const useProfileStore = defineStore("profile", () => {

  const {fetchCuratedPosts } = usePostStore();
  const commentList: CommentItem[] = [];

  const curatedPosts = fetchCuratedPosts("", 10);

  for (let i = 0; i < curatedPosts.length; i++) {
    const curatedItem = curatedPosts[i];

    const commentItem: CommentItem = {
      postSlugId: curatedItem.metadata.slugId,
      title: curatedItem.payload.title,
      authorName: curatedItem.metadata.posterName,
      createdAt: curatedItem.metadata.createdAt,
      numUpvotes: 20,
      numDownvotes: 10,
      userComment: "Dummy user comment " + i + ". At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.",
      commentSlugId: "comment-slug-id-" + i
    };

    commentList.push(commentItem);
  }

  return { commentList };

});
