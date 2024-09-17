export interface CommentSortingItemInterface {
  label2: string;
  icon2: string;
  value: string;
  description: string;
  slot: string;
}

export function useCommentOptions() {

  function getCommentSortOptions() {

    const commentOptions: CommentSortingItemInterface[] = [
      {
        label2: "Popular",
        icon2: "mdi-rocket",
        value: "popular",
        description: "Highest like/dislike ratio",
        slot: "one"
      },
      {
        label2: "Controversial",
        icon2: "mdi-sword",
        value: "controversial",
        description: "Most average like/dislike ratio",
        slot: "two"
      },
      {
        label2: "New",
        icon2: "mdi-decagram-outline",
        value: "new",
        description: "Most recent comments",
        slot: "three"
      },
      {
        label2: "Surprising ",
        icon2: "mdi-lightbulb",
        value: "surprising",
        description: "Surprisingly popular (click to know more)",
        slot: "four"
      }
    ];

    return commentOptions;
  }

  return {
     getCommentSortOptions
  };

}
