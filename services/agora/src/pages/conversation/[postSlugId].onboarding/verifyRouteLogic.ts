import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import {
  getConversationSurveyCompletePath,
  getConversationSurveyRoutePath,
  getConversationSurveyVerifyEmailPath,
  getConversationSurveyVerifyHardPath,
  getConversationSurveyVerifyIdentityPath,
  getConversationSurveyVerifyTicketPath,
} from "src/utils/survey/navigation";

export type VerifyRouteDecision =
  | { kind: "none" }
  | { kind: "redirect"; path: string }
  | { kind: "complete" }
  | { kind: "dismiss" };

export function resolveVerifyRouteDecision({
  exactVerifyRoute,
  participationStatus,
  conversationSlugId,
  routeContext,
}: {
  exactVerifyRoute: boolean;
  participationStatus: ParticipationStatus;
  conversationSlugId: string;
  routeContext: ConversationRouteContext;
}): VerifyRouteDecision {
  if (!exactVerifyRoute) return { kind: "none" };
  switch (participationStatus.status) {
    case "checking":
    case "unavailable":
      return { kind: "none" };
    case "ready":
      return { kind: "complete" };
    case "blocked":
      return { kind: "dismiss" };
    case "onboarding_required": {
      const params = { conversationSlugId, routeContext };
      const step = participationStatus.nextStep;
      switch (step.kind) {
        case "account":
          return {
            kind: "redirect",
            path: getConversationSurveyVerifyHardPath(params),
          };
        case "email":
          return {
            kind: "redirect",
            path: getConversationSurveyVerifyEmailPath(params),
          };
        case "identity":
          return {
            kind: "redirect",
            path: getConversationSurveyVerifyIdentityPath(params),
          };
        case "ticket":
          return {
            kind: "redirect",
            path: getConversationSurveyVerifyTicketPath(params),
          };
        case "email_updates":
          return {
            kind: "redirect",
            path: getConversationSurveyCompletePath(params),
          };
        case "survey":
          return {
            kind: "redirect",
            path: getConversationSurveyRoutePath({
              ...params,
              routeResolution: step.routeResolution,
            }),
          };
      }
    }
  }
}
