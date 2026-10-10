import type { RouteLocationNormalizedLoaded } from "vue-router";

import { isConversationRoutePath } from "./conversationRouteContext";
import { getSingleRouteParam } from "./params";

export function getConversationMetadataSlugId({
  name,
  params,
}: Pick<RouteLocationNormalizedLoaded, "name" | "params">): string | undefined {
  // Matched route names are canonical even when the URL uses different casing.
  if (typeof name !== "string" || !isConversationRoutePath(name)) {
    return undefined;
  }
  const slugId =
    "postSlugId" in params
      ? params.postSlugId
      : "conversationSlugId" in params
        ? params.conversationSlugId
        : undefined;
  return getSingleRouteParam(slugId) || undefined;
}
