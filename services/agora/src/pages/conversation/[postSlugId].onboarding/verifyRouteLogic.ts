import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import { getConversationOnboardingStepPath } from "src/utils/survey/navigation";

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
    case "onboarding_required":
      return {
        kind: "redirect",
        path: getConversationOnboardingStepPath({
          conversationSlugId,
          routeContext,
          nextStep: participationStatus.nextStep,
        }),
      };
  }
}
