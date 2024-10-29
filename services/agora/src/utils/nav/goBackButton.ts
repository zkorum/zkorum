import { useRoute, useRouter } from "vue-router";
import { useLastNavigatedRouteName } from "./lastNavigatedRouteName";

export function useGoBackButtonHandler() {
  const router = useRouter();
  const route = useRoute();

  const { lastNavigatedRouteName } = useLastNavigatedRouteName();

  function goBack() {
    // const pullUpRouteNameList = ["settings-page", "help-page", "create-post"];

    if (route.name == "single-post") {
      router.push({ name: "default-home-feed" });
    } else {
      if (lastNavigatedRouteName.value == "") {
        router.push({ name: "default-home-feed" });
      } else {
        router.go(-1);
      }
    }
  }

  return { goBack };
}
