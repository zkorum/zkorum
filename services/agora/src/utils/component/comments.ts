export interface CommentSortingItemInterface {
  label: string;
  icon: string;
  value: string;
  description: string;
}

export function useCommentOptions() {

  function getCommentSortOptions() {

    const commentOptions: CommentSortingItemInterface[] = [
      {
        label: "Popular",
        icon: "mdi-rocket",
        value: "popular",
        description: "Highest like/dislike ratio",
      },
      {
        label: "Controversial",
        icon: "mdi-sword",
        value: "controversial",
        description: "Most average like/dislike ratio",
      },
      {
        label: "New",
        icon: "mdi-decagram-outline",
        value: "new",
        description: "Most recent comments",
      },
      {
        label: "Surprising",
        icon: "mdi-lightbulb",
        value: "surprising",
        description: "Surprisingly popular comments",
      },
      {
        label: "Clusters",
        icon: "mdi-chart-bubble",
        value: "clusters",
        description: "Visual representation of the opinion clusters",
      },
      {
        label: "More",
        icon: "mdi-dots-horizontal",
        value: "more",
        description: "You're a researcher? We're on the lookout for more algorithms",
      }
    ];

    return commentOptions;
  }

  return {
     getCommentSortOptions
  };

}
