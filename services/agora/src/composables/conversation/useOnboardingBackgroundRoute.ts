import {
  getConversationLocation,
  getConversationRouteContextFromRoute,
  isConversationOnboardingRouteName,
} from "src/utils/router/conversationRouteContext";
import { getSingleRouteParam } from "src/utils/router/params";
import { computed, shallowRef, watch } from "vue";
import {
  loadRouteLocation,
  type RouteLocationNormalizedLoaded,
  useRouter,
} from "vue-router";

export type OnboardingBackground =
  | { kind: "loading" }
  | { kind: "ready"; route: RouteLocationNormalizedLoaded }
  | { kind: "failed" };

export function useOnboardingBackgroundRoute() {
  const router = useRouter();
  const background = shallowRef<OnboardingBackground>({ kind: "loading" });
  const isOnboarding = computed(() =>
    isConversationOnboardingRouteName(router.currentRoute.value.name)
  );
  // An onboarding step change keeps this primitive target unchanged. In-flight
  // background imports therefore survive redirects and question navigation.
  const backgroundTarget = computed(() => {
    const route = router.currentRoute.value;
    if (!isConversationOnboardingRouteName(route.name)) return route;
    const postSlugId = getSingleRouteParam(
      "postSlugId" in route.params ? route.params.postSlugId : undefined
    );
    const context = getConversationRouteContextFromRoute(route);
    // Named routes encode parameters, so a decoded slash or dot segment cannot
    // turn a direct onboarding link into an arbitrary background page.
    return router.resolve(
      getConversationLocation({
        conversationSlugId: postSlugId,
        routeContext: context,
      })
    ).fullPath;
  });

  watch(
    backgroundTarget,
    async (target, previous, onCleanup) => {
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      if (typeof target !== "string") {
        background.value = { kind: "ready", route: target };
        return;
      }
      // Retain the already-authorized originating page, including feeds. A fresh
      // link reconstructs only the public conversation, never a stored arbitrary route.
      if (previous !== undefined && typeof previous !== "string") return;
      background.value = { kind: "loading" };
      try {
        const loadedRoute = await loadRouteLocation(router.resolve(target));
        if (!cancelled)
          background.value = { kind: "ready", route: loadedRoute };
      } catch (error) {
        if (cancelled) return;
        background.value = { kind: "failed" };
        console.error("Failed to load onboarding background", error);
      }
    },
    { immediate: true, flush: "sync" }
  );

  return { background, isOnboarding };
}
