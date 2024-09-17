export function useCommentOptions() {

  function getCommentSortOptions() {

    interface CommentInterface {
      label: string;
      icon: string;
      value: string;
    }

    const commentOptions: CommentInterface[] = [{
      label: "New",
      icon: "mdi-decagram-outline",
      value: "new",
    },
    {
      label: "Popular",
      icon: "mdi-rocket",
      value: "popular",
    },
    {
      label: "Controversial",
      icon: "mdi-sword",
      value: "controversial",
    }];

    return commentOptions;
  }

  return {
     getCommentSortOptions
  };

}
