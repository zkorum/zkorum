export function useCommentOptions() {


  function mapCommentSortOption(id: string) {
    const optionList = getCommentSortOptions();

    for (let i = 0; i < optionList.length; i++) {
      const item = optionList[i];
      if (id == item.id) {
        return item.label;
      }
    }

    return "";

  }

  function getCommentSortOptions() {

    const commentOptions = [{
      label: "New",
      icon: "mdi-decagram-outline",
      id: "new",
      style: {}
    },
    {
      label: "Popular",
      icon: "mdi-rocket",
      id: "popular",
      style: {}
    },
    {
      label: "Controversial",
      icon: "mdi-sword",
      id: "controversial",
      style: {}
    }];

    return commentOptions;
  }

  return {
    mapCommentSortOption, getCommentSortOptions
  };

}
