import { useStorage } from "@vueuse/core";
import { onMounted } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

export function useGoBackButtonHandler() {
  const router = useRouter();
  const route = useRoute();

  const lastNavigatedRouteName = useStorage("last-navigated-route-name", "");

  onMounted(() => {
    lastNavigatedRouteName.value = "";
  });

  onBeforeRouteLeave(() => {
    const routeName = route.name;
    if (routeName == null || routeName == undefined) {
      console.log("Failed to get route name");
    } else {
      lastNavigatedRouteName.value = routeName.toString();
    }
  });

  function goBack() {
    if (lastNavigatedRouteName.value == "") {
      router.push({ name: "default-home-feed" });
    } else {
      router.back();
    }
  }

  return { goBack, lastNavigatedRouteName };
}