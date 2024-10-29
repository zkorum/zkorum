import { useQuasar } from "quasar";
import { Ref } from "vue";
import { useDialog } from "./dialog";

export const useBottomSheet = () => {
  const quasar = useQuasar();

  const dialog = useDialog();

  function showCommentOptionSelector() {
    const actionList = [];

    actionList.push({
      label: "Report Comment",
      icon: "mdi-flag",
      id: "report",
    });

    quasar
      .bottomSheet({
        message: "Select an action for this comment",
        grid: false,
        actions: actionList,
      })
      .onOk((action) => {
        console.log("Selected action: " + action.id);
        if (action.id == "report") {
          showStandardReportSelector("comment");
        }
      })
      .onCancel(() => {
        console.log("Dismissed");
      })
      .onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      });
  }

  function showPostOptionSelector() {
    const actionList = [];

    actionList.push({
      label: "Report",
      icon: "mdi-flag",
      id: "report",
    });

    quasar
      .bottomSheet({
        message: "Select an action for this post",
        grid: false,
        actions: actionList,
      })
      .onOk((action) => {
        console.log("Selected action: " + action.id);
        if (action.id == "report") {
          showStandardReportSelector("post");
        }
      })
      .onCancel(() => {
        console.log("Dismissed");
      })
      .onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      });
  }

  function showStandardReportSelector(itemName: "post" | "comment") {
    const actionList = [];

    const icon = "mdi-circle-small";

    actionList.push(
      {
        label: "Spam",
        icon: icon,
        id: "spam",
      },
      {
        label: "Irrelevant",
        icon: icon,
        id: "irrelevant",
      },
      {
        label: "Harassment",
        icon: icon,
        id: "harassment",
      },
      {
        label: "Hate",
        icon: icon,
        id: "hate",
      },
      {
        label: "Sharing personal information",
        icon: icon,
        id: "personal-information",
      },
      {
        label: "Threatening violence",
        icon: icon,
        id: "violence",
      },
      {
        label: "Sexualization",
        icon: icon,
        id: "sexualization",
      }
    );

    quasar
      .bottomSheet({
        message: `Why do you think this ${itemName} is not appropriate?`,
        grid: false,
        actions: actionList,
      })
      .onOk((action) => {
        console.log("Selected action: " + action.id);
        dialog.showReportDialog(itemName);
      })
      .onCancel(() => {
        console.log("Dismissed");
      })
      .onDismiss(() => {
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
        id: "spam",
      },
      {
        label: "Irrelevant",
        icon: icon,
        id: "irrelevant",
      },
      {
        label: "Harassment",
        icon: icon,
        id: "harassment",
      },
      {
        label: "Hate",
        icon: icon,
        id: "hate",
      },
      {
        label: "Sharing personal information",
        icon: icon,
        id: "personal-information",
      },
      {
        label: "Threatening violence",
        icon: icon,
        id: "violence",
      },
      {
        label: "Sexualization",
        icon: icon,
        id: "sexualization",
      }
    );

    quasar
      .bottomSheet({
        message:
          "Why do you think this comment is not appropriate for ranking?",
        grid: false,
        actions: actionList,
      })
      .onOk((action) => {
        console.log("Selected action: " + action.id);
        reportReasonId.value = action.id;
      })
      .onCancel(() => {
        console.log("Dismissed");
      })
      .onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      });
  }

  return {
    showPostOptionSelector,
    showCommentRankingReportSelector,
    showCommentOptionSelector,
  };
};
