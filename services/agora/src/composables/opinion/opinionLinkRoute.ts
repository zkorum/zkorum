import { zodOpinionListFilter } from "src/shared/types/dto";
import { zodSlugId } from "src/shared/types/zod";
import type { CommentFilterOptions } from "src/utils/component/opinion";
import {
  getConversationPath,
  getConversationRouteContextFromRoute,
} from "src/utils/router/conversationRouteContext";
import { getSingleRouteParam } from "src/utils/router/params";
import type { RouteLocationNormalizedLoaded } from "vue-router";

export function isOpinionListRoute({
  route,
  conversationSlugId,
}: {
  route: RouteLocationNormalizedLoaded;
  conversationSlugId: string;
}): boolean {
  if (
    getSingleRouteParam(
      "postSlugId" in route.params ? route.params.postSlugId : undefined
    ) !== conversationSlugId
  )
    return false;
  const routeContext = getConversationRouteContextFromRoute(route);
  if (routeContext.kind === "embed") return false;
  return (
    route.path.replace(/\/$/, "") ===
    getConversationPath({ conversationSlugId, routeContext }).replace(/\/$/, "")
  );
}

export function getLinkedOpinionSlugId({
  route,
  conversationSlugId,
}: {
  route: RouteLocationNormalizedLoaded;
  conversationSlugId: string;
}): string | undefined {
  if (!isOpinionListRoute({ route, conversationSlugId })) return undefined;
  const slugId = zodSlugId.min(1).safeParse(route.query.opinion);
  return slugId.success && slugId.data.trim() !== "" ? slugId.data : undefined;
}

export type OpinionFilterSelection =
  | { kind: "automatic" }
  | { kind: "explicit"; filter: CommentFilterOptions };

export function getOpinionFilterSelection(
  route: RouteLocationNormalizedLoaded
): OpinionFilterSelection {
  const filter = zodOpinionListFilter.safeParse(route.query.filter);
  return filter.success
    ? { kind: "explicit", filter: filter.data }
    : { kind: "automatic" };
}
