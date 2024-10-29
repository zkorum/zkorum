import { ref } from "vue";

export const useNewPostDraftsStore = () => {
  interface NewPostDraft {
    postTitle: string;
    postBody: string;
    enablePolling: boolean;
    pollingOptionList: string[];
  }

  const emptyDraft: NewPostDraft = {
    postTitle: "",
    postBody: "",
    enablePolling: false,
    pollingOptionList: ["", ""],
  };

  const postDraft = ref<NewPostDraft>(structuredClone(emptyDraft));

  function isPostEdited() {
    const trimmedDraft = postDraft.value;
    trimmedDraft.enablePolling = false;
    if (JSON.stringify(emptyDraft) == JSON.stringify(trimmedDraft)) {
      return false;
    } else {
      return true;
    }
  }

  return { postDraft, isPostEdited };
};
