import { useRouter } from "vue-router";
import { useLastNavigatedRouteName } from "./lastNavigatedRouteName";

export function useGoBackButtonHandler() {
  const router = useRouter();

  const { lastNavigatedRouteFullPath, lastNavigatedRouteName } = useLastNavigatedRouteName();

  function clearVariables() {
    lastNavigatedRouteFullPath.value = "";
    lastNavigatedRouteName.value = "";
  }

  function goBack() {
    if (lastNavigatedRouteName.value == "") {
      router.push({ name: "default-home-feed" });
      clearVariables();
    } else {
      router.push({ path: lastNavigatedRouteFullPath.value });
      clearVariables();
    }
  }

  return { goBack };
}
