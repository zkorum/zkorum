import { useSessionStorage } from "@vueuse/core";

export function useLastNavigatedRouteName() {

  const lastNavigatedRouteName = useSessionStorage("last-navigated-route-name", "");

  return { lastNavigatedRouteName };
}
