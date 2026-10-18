import type { RouteLocationNormalized } from "vue-router";

import {
  getConversationPath,
  getConversationRouteContextFromRoute,
  isConversationOnboardingRouteName,
} from "./conversationRouteContext";
import { getSingleRouteParam } from "./params";

type ScrollRoute = Pick<RouteLocationNormalized, "name" | "params"> &
  Partial<Pick<RouteLocationNormalized, "fullPath" | "path">>;

export function createOnboardingScrollPreservation({
  conversationTabRouteNames,
}: {
  conversationTabRouteNames: ReadonlySet<string>;
}) {
  let originFullPath: string | undefined;
  function shouldPreserveScroll({
    to,
    from,
  }: {
    to: RouteLocationNormalized;
    from: RouteLocationNormalized;
  }): boolean {
    if (
      isConversationOnboardingRouteName(to.name) &&
      !isConversationOnboardingRouteName(from.name)
    ) {
      originFullPath = from.matched.length > 0 ? from.fullPath : undefined;
    }
    const preserve = shouldPreserveOnboardingScroll({
      to,
      from,
      conversationTabRouteNames,
      originFullPath,
    });
    if (!isConversationOnboardingRouteName(to.name)) originFullPath = undefined;
    return preserve;
  }
  return { shouldPreserveScroll };
}

export function shouldPreserveOnboardingScroll({
  to,
  from,
  conversationTabRouteNames,
  originFullPath,
}: {
  to: ScrollRoute;
  from: ScrollRoute;
  conversationTabRouteNames: ReadonlySet<string>;
  originFullPath?: string;
}): boolean {
  if (isConversationOnboardingRouteName(to.name)) return true;
  if (
    isConversationOnboardingRouteName(from.name) &&
    originFullPath !== undefined &&
    to.fullPath === originFullPath
  )
    return true;
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
