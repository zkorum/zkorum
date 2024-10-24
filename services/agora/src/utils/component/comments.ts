export interface CommentSortingItemInterface {
  label: string;
  icon: string;
  value: string;
  description: string;
  index: number;
}

export function useCommentOptions() {

  function getCommentSortOptions() {

    const commentOptions: CommentSortingItemInterface[] = [
      {
        label: "Popular",
        icon: "mdi-rocket",
        value: "popular",
        description: "Highest like/dislike ratio",
        index: 0
      },
      {
        label: "Controversial",
        icon: "mdi-sword",
        value: "controversial",
        description: "Most average like/dislike ratio",
        index: 1
      },
      {
        label: "New",
        icon: "mdi-decagram-outline",
        value: "new",
        description: "Most recent comments",
        index: 2
      },
      {
        label: "Clusters",
        icon: "mdi-chart-bubble",
        value: "clusters",
        description: "Visual representation of the opinion clusters",
        index: 3
      },
      {
        label: "Surprising",
        icon: "mdi-lightbulb",
        value: "surprising",
        description: "Surprisingly popular comments",
        index: 4
      },
      {
        label: "More",
        icon: "mdi-dots-horizontal",
        value: "more",
        description: "Are you a researcher? We are on the lookout for more algorithms",
        index: 5
      }
    ];

    return commentOptions;
  }

  return {
    getCommentSortOptions
  };

}
