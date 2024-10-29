import { useSessionStorage } from "@vueuse/core";

export function useLastNavigatedRouteName() {
  const lastNavigatedRouteName = useSessionStorage(
    "last-navigated-route-name",
    ""
  );
  const lastNavigatedRouteFullPath = useSessionStorage(
    "last-navigated-route-full-path",
    ""
  );

  return { lastNavigatedRouteName, lastNavigatedRouteFullPath };
}
