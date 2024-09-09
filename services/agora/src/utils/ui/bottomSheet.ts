import { useQuasar } from "quasar";

export const useBottomSheet = () => {

  const quasar = useQuasar();

  // Return the selected community name
  function showPostOptionSelector(grid: boolean) {

    const actionList = [];

    actionList.push({
      label: "Report",
      icon: "mdi-flag",
      id: "report"
    });

    quasar.bottomSheet({
      message: "Select an action for this post",
      grid,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      if (action.id == "report") {
        processReportAction();
      }
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }

  function processReportAction() {
    quasar.dialog({
      title: "Report System",
      message: "Would you like to report this post?",
      cancel: true,
      persistent: false,
    }).onOk(() => {
      quasar.dialog({
        title: "Thank you for the report",
        message: "Admins will investigate if the post contains inappropriate content.",
      });
    });
  }

  return { showPostOptionSelector };
}
