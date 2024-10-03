import { useStorage } from "@vueuse/core";
import { useRouter } from "vue-router";

export function useGoBackButtonHandler() {
  const router = useRouter();

  const lastNavigatedRouteName = useStorage("last-navigated-route-name", "");

  function goBack() {
    if (lastNavigatedRouteName.value == "") {
      router.push({ name: "default-home-feed" });
    } else {
      router.back();
    }
  }

  return { goBack, lastNavigatedRouteName };
}
