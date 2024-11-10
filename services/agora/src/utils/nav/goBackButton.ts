import { useRouter } from "vue-router";

export function useGoBackButtonHandler() {
  const router = useRouter();

  function goBack() {
    // const pullUpRouteNameList = ["settings-page", "help-page", "create-post"];
    router.go(-1);
  }

  return { goBack };
}
