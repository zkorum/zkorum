import { useCommunityStore } from "@/stores/community";
import { useQuasar } from "quasar";
import { Ref } from "vue";

export const useBottomSheet = () => {

  const quasar = useQuasar();

  // Return the selected community name
  function showCreatePostCommunitySelector(grid: boolean, selectedCommunityId: Ref<string>) {

    const communityList = useCommunityStore().communityList;
    const actionList = [];

    for (let i = 0; i < communityList.length; i++) {
      const communitItem = communityList[i];
      actionList.push({
        label: communitItem.countryName,
        img: "/images/communities/flags/" + communitItem.code + ".svg",
        id: communitItem.id
      });
    }

    quasar.bottomSheet({
      message: "Select a community for the new post",
      grid,
      actions: actionList
    }).onOk(action => {
      console.log("Selected action: " + action.id);
      selectedCommunityId.value = action.id;
    }).onCancel(() => {
      console.log("Dismissed");
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    })
  }


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
        message: "We will investigate if the clip contains inappropriate content",
      });
    });
  }

  return { showCreatePostCommunitySelector, showPostOptionSelector };
}
