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
        index: 0,
      },
      {
        label: "Controversial",
        icon: "mdi-sword",
        value: "controversial",
        description: "Most average like/dislike ratio",
        index: 1,
      },
      {
        label: "New",
        icon: "mdi-decagram-outline",
        value: "new",
        description: "Most recent comments",
        index: 2,
      },
      {
        label: "Clusters",
        icon: "mdi-chart-bubble",
        value: "clusters",
        description: "Visual representation of the opinion clusters",
        index: 3,
      }
    ];

    return commentOptions;
  }

  return {
    getCommentSortOptions,
  };
}
