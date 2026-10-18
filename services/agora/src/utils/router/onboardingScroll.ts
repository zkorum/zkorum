import type { RouteLocationNormalized } from "vue-router";

import {
  getConversationPath,
  getConversationRouteContextFromRoute,
  isConversationOnboardingRouteName,
} from "./conversationRouteContext";
import { getSingleRouteParam } from "./params";

type ScrollRoute = Pick<RouteLocationNormalized, "name" | "params">;

export function shouldPreserveOnboardingScroll({
  to,
  from,
  conversationTabRouteNames,
}: {
  to: ScrollRoute;
  from: ScrollRoute;
  conversationTabRouteNames: ReadonlySet<string>;
}): boolean {
  if (isConversationOnboardingRouteName(to.name)) return true;
  if (
    !isConversationOnboardingRouteName(from.name) ||
    typeof to.name !== "string" ||
    !conversationTabRouteNames.has(to.name)
  )
    return false;

  return getConversationPathForRoute(to) === getConversationPathForRoute(from);
}

function getConversationPathForRoute(route: ScrollRoute): string {
  return getConversationPath({
    conversationSlugId: getSingleRouteParam(
      "postSlugId" in route.params ? route.params.postSlugId : undefined
    ),
    routeContext: getConversationRouteContextFromRoute(route),
  });
}
