import { useQuasar } from "quasar";
import { Ref } from "vue";
import { useCommentOptions } from "../component/comments";

export const useBottomSheet = () => {

  const quasar = useQuasar();

  function showCommentOptionSelector() {

    const actionList = [];

    actionList.push({
      label: "Report Comment",
      icon: "mdi-flag",
      id: "report"
    });

    quasar.bottomSheet({
      message: "Select an action for this comment",
      grid: false,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      if (action.id == "report") {
        showStandardReportSelector(false);
      }
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
  }

  function showPostOptionSelector() {

    const actionList = [];

    actionList.push({
      label: "Report",
      icon: "mdi-flag",
      id: "report"
    });

    quasar.bottomSheet({
      message: "Select an action for this post",
      grid: false,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      if (action.id == "report") {
        showStandardReportSelector(true);
      }
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
  }


  function showStandardReportSelector(isPost: boolean) {

    const actionList = [];

    const icon = "mdi-circle-small";

    actionList.push(
      {
        label: "Spam",
        icon: icon,
        id: "spam"
      },
      {
        label: "Irrelevant",
        icon: icon,
        id: "irrelevant"
      },
      {
        label: "Harassment",
        icon: icon,
        id: "harassment"
      },
      {
        label: "Hate",
        icon: icon,
        id: "hate"
      },
      {
        label: "Sharing personal information",
        icon: icon,
        id: "personal-information"
      },
      {
        label: "Threatening violence",
        icon: icon,
        id: "violence"
      },
      {
        label: "Sexualization",
        icon: icon,
        id: "sexualization"
      }
    );

    let itemName = "post";
    if (!isPost) {
      itemName = "comment";
    }

    quasar.bottomSheet({
      message: `Why do you think this ${itemName} is not appropriate?`,
      grid: false,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      processReportAction(isPost);
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
  }

  function showCommentRankingReportSelector(reportReasonId: Ref<string>) {

    const actionList = [];

    const icon = "mdi-circle-small";

    actionList.push(
      {
        label: "Spam",
        icon: icon,
        id: "spam"
      },
      {
        label: "Irrelevant",
        icon: icon,
        id: "irrelevant"
      },
      {
        label: "Harassment",
        icon: icon,
        id: "harassment"
      },
      {
        label: "Hate",
        icon: icon,
        id: "hate"
      },
      {
        label: "Sharing personal information",
        icon: icon,
        id: "personal-information"
      },
      {
        label: "Threatening violence",
        icon: icon,
        id: "violence"
      },
      {
        label: "Sexualization",
        icon: icon,
        id: "sexualization"
      }
    );

    quasar.bottomSheet({
      message: "Why do you think this comment is not appropriate for ranking?",
      grid: false,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      reportReasonId.value = action.id;
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
  }

  function showCommentSortSelector(currentPreferenceId: Ref<string>) {

    const actionList = useCommentOptions().getCommentSortOptions();

    for (let i = 0; i < actionList.length; i++) {
      const item = actionList[i];
      if (currentPreferenceId.value == item.id) {
        item.style = { fontWeight: "bold" };
      }
    }

    quasar.bottomSheet({
      message: "Sort comments by",
      grid: false,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      currentPreferenceId.value = action.id;
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
  }

  function processReportAction(isPost: boolean) {

    let itemName = "post";
    if (!isPost) {
      itemName = "comment";
    }

    quasar.dialog({
      title: "Thank you for the report",
      message: `Admins will investigate if the ${itemName} contains inappropriate content.`,
    });

  }

  return { showPostOptionSelector, showCommentSortSelector, showCommentRankingReportSelector, showCommentOptionSelector };
};
