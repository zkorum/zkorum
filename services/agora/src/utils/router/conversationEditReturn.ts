import type { ConversationProjectAssignment } from "src/shared/types/zod";
import type { LocationQueryValue } from "vue-router";

type ReturnToQueryValue = LocationQueryValue | LocationQueryValue[];

interface GetConversationEditReturnPathParams {
  conversationSlugId: string;
  returnTo: ReturnToQueryValue;
  projectAssignment?: ConversationProjectAssignment;
}

function getDefaultConversationPath(conversationSlugId: string): string {
  return `/conversation/${encodeURIComponent(conversationSlugId)}/`;
}

function getDecodedPathSegment(segment: string | undefined): string | null {
  if (segment === undefined || segment.length === 0) {
    return null;
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function getConversationEditReturnPath({
  conversationSlugId,
  returnTo,
  projectAssignment,
}: GetConversationEditReturnPathParams): string {
  if (typeof returnTo !== "string") {
    return getDefaultConversationPath(conversationSlugId);
  }

  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return getDefaultConversationPath(conversationSlugId);
  }

  const returnUrl = new URL(returnTo, "https://agora.local");
  const pathSegments = returnUrl.pathname.split("/");

  const isProjectRoute =
    pathSegments[1] === "project" && pathSegments[3] === "conversation";
  if (pathSegments[1] !== "conversation" && !isProjectRoute) {
    return getDefaultConversationPath(conversationSlugId);
  }

  const conversationSegmentIndex = isProjectRoute ? 4 : 2;
  const routeSlugSegment = getDecodedPathSegment(
    pathSegments[conversationSegmentIndex]
  );
  const isSameConversation =
    routeSlugSegment === conversationSlugId ||
    routeSlugSegment === `${conversationSlugId}.embed`;

  if (!isSameConversation) {
    return getDefaultConversationPath(conversationSlugId);
  }

  if (pathSegments[conversationSegmentIndex + 1] === "edit") {
    return getDefaultConversationPath(conversationSlugId);
  }

  if (isProjectRoute && projectAssignment !== undefined) {
    const target = projectAssignment.target;
    const suffix = pathSegments.slice(conversationSegmentIndex + 1).join("/");
    const base =
      target.kind === "project"
        ? `/project/${encodeURIComponent(target.projectSlug)}/conversation/${encodeURIComponent(conversationSlugId)}/`
        : getDefaultConversationPath(conversationSlugId);
    return `${base}${suffix}${returnUrl.search}${returnUrl.hash}`;
  }
  return `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`;
}
