import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { getHistoryPosition } from "src/utils/nav/historyBack";
import type { Router } from "vue-router";

import {
  getConversationLocation,
  getConversationRouteContextFromRoute,
  isConversationOnboardingRouteName,
} from "./conversationRouteContext";
import { getSingleRouteParam } from "./params";

export function registerOnboardingNavigation(router: Router): void {
  router.beforeResolve((to, from) => {
    if (!isConversationOnboardingRouteName(to.name)) return;

    const store = useConversationOnboardingStore();
    const conversationSlugId = getSingleRouteParam(
      "postSlugId" in to.params ? to.params.postSlugId : undefined
    );
    const routeContext = getConversationRouteContextFromRoute(to);
    const fallbackPath = router.resolve(
      getConversationLocation({ conversationSlugId, routeContext })
    ).fullPath;
    const fromOnboarding = isConversationOnboardingRouteName(from.name);
    if (
      fromOnboarding &&
      store.conversationSlugId === conversationSlugId &&
      router.resolve(
        getConversationLocation({
          conversationSlugId,
          routeContext: getConversationRouteContextFromRoute(from),
        })
      ).fullPath === fallbackPath
    )
      return;
    const hasOrigin = !fromOnboarding && from.matched.length > 0;
    // Participation entry may already have recorded resume mode. Keep it when
    // it belongs to this exact origin, rather than carrying an older session.
    if (
      store.conversationSlugId === conversationSlugId &&
      store.returnTarget === from.fullPath &&
      hasOrigin
    )
      return;

    store.startManualEntry({
      conversationSlugId,
      returnTarget: hasOrigin ? from.fullPath : fallbackPath,
      returnHistoryPosition: hasOrigin
        ? getHistoryPosition({ historyState: router.options.history.state })
        : null,
      routeContext,
    });
  });

  router.afterEach((to, from, failure) => {
    if (
      failure !== undefined ||
      !isConversationOnboardingRouteName(from.name) ||
      isConversationOnboardingRouteName(to.name)
    )
      return;
    // Browser back and unrelated navigation leave the flow too, without calling
    // a step's close handler.
    useConversationOnboardingStore().clearForConversation({
      conversationSlugId: getSingleRouteParam(
        "postSlugId" in from.params ? from.params.postSlugId : undefined
      ),
    });
  });
}
