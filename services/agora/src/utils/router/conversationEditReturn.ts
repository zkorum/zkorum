import type { ConversationProjectAssignment } from "src/shared/types/zod";
import type { LocationQueryValue } from "vue-router";

type ReturnToQueryValue = LocationQueryValue | LocationQueryValue[] | undefined;

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

  let returnUrl: URL;
  try {
    returnUrl = new URL(returnTo, "https://agora.local");
  } catch {
    return getDefaultConversationPath(conversationSlugId);
  }
  if (returnUrl.origin !== "https://agora.local")
    return getDefaultConversationPath(conversationSlugId);
  const pathSegments = returnUrl.pathname.split("/");

  const isProjectRoute =
    pathSegments[1] === "project" &&
    pathSegments[3] === "conversation" &&
    getDecodedPathSegment(pathSegments[2]) !== null;
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

export function getConversationEditFallbackPath({
  conversationSlugId,
  returnTo,
}: Pick<
  GetConversationEditReturnPathParams,
  "conversationSlugId" | "returnTo"
>): string {
  if (!conversationSlugId) return "/";
  const safePath = getConversationEditReturnPath({
    conversationSlugId,
    returnTo,
  });
  const segments = new URL(safePath, "https://agora.local").pathname.split("/");
  const projectSlug = segments[2];
  // Error recovery always returns to the main view, never another edit,
  // onboarding, or embedded route that may lack normal navigation.
  if (segments[1] === "project" && projectSlug !== undefined) {
    return `/project/${projectSlug}/conversation/${encodeURIComponent(conversationSlugId)}/`;
  }
  return getDefaultConversationPath(conversationSlugId);
}
