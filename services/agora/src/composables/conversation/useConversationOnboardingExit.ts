import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import {
  getHistoryPosition,
  navigateToHistoryPositionOrReplace,
} from "src/utils/nav/historyBack";
import {
  type ConversationRouteContext,
  getConversationLocation,
  getConversationRouteContextFromRoute,
  isConversationOnboardingRouteName,
} from "src/utils/router/conversationRouteContext";
import { getSingleRouteParam } from "src/utils/router/params";
import { useRouter } from "vue-router";

export function useConversationOnboardingExit() {
  const router = useRouter();
  const conversationOnboardingStore = useConversationOnboardingStore();

  async function exitToConversation({
    conversationSlugId,
    routeContext,
  }: {
    conversationSlugId: string;
    routeContext?: ConversationRouteContext;
  }): Promise<boolean> {
    const currentRoute = router.currentRoute.value;
    if (
      !isConversationOnboardingRouteName(currentRoute.name) ||
      getSingleRouteParam(
        "postSlugId" in currentRoute.params
          ? currentRoute.params.postSlugId
          : undefined
      ) !== conversationSlugId
    )
      return false;
    const hasCurrentOnboardingState =
      conversationOnboardingStore.conversationSlugId === conversationSlugId;
    const fallbackPath =
      hasCurrentOnboardingState &&
      conversationOnboardingStore.returnTarget !== null
        ? conversationOnboardingStore.returnTarget
        : router.resolve(
            getConversationLocation({
              conversationSlugId,
              routeContext:
                routeContext ??
                getConversationRouteContextFromRoute(currentRoute),
            })
          ).fullPath;
    const targetHistoryPosition = hasCurrentOnboardingState
      ? conversationOnboardingStore.returnHistoryPosition
      : null;

    return await navigateToHistoryPositionOrReplace({
      router,
      fallbackRoute: fallbackPath,
      targetHistoryPosition,
      currentHistoryPosition: getHistoryPosition({
        historyState: router.options.history.state,
      }),
    });
  }

  return {
    exitToConversation,
  };
}
