import { useStorage } from "@vueuse/core";

export function useLastNavigatedRouteName() {

  const lastNavigatedRouteName = useStorage("last-navigated-route-name", "");

  return { lastNavigatedRouteName };
}
