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
        img: "/public/images/communities/flags/" + communitItem.code + ".svg",
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

  return { showCreatePostCommunitySelector };
}
