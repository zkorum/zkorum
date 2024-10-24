import { useRouter } from "vue-router";
import { useLastNavigatedRouteName } from "./lastNavigatedRouteName";

export function useGoBackButtonHandler() {
  const router = useRouter();

  const { lastNavigatedRouteName } = useLastNavigatedRouteName();

  function goBack() {
    if (lastNavigatedRouteName.value == "") {
      router.push({ name: "default-home-feed" });
    } else {
      router.push({ name: lastNavigatedRouteName.value });
      // if (pullUpRouteNameList.includes(lastNavigatedRouteName.value)) {
      //  router.push({ name: "default-home-feed" });
      // } else {
      // router.back();
      // }
    }
  }

  /*
  function pushNewRoute(fromName: string) {
    lastNavigatedRouteName.value = fromName;
  }
  */

  return { goBack };
}
