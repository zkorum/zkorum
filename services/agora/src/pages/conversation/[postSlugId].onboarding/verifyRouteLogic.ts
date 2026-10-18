import type { SurveyStatusCheckResponse } from "src/shared/types/dto";
import type { ParticipationMode } from "src/shared/types/zod";
import type { ConversationEmailUpdateOnboardingResolution } from "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries";
import type { SurveyFormData } from "src/utils/api/survey/useSurveyQueries";
import {
  type ConversationRouteContext,
  normalConversationRouteContext,
} from "src/utils/router/conversationRouteContext";
import {
  getConversationPath,
  getConversationSurveyCompletePath,
  getConversationSurveyContinuePath,
  getConversationSurveyVerifyEmailPath,
  getConversationSurveyVerifyHardPath,
  getConversationSurveyVerifyIdentityPath,
  getConversationSurveyVerifyTicketPath,
} from "src/utils/survey/navigation";
import { getCredentialUpgradeDestination } from "src/utils/survey/requirements";

export interface VerifyRouteConversationState {
  participationMode: ParticipationMode;
}

export interface VerifyRouteRequirementState {
  needsAuth: boolean;
  needsTicket: boolean;
}

export interface VerifyRouteDecision {
  navigation:
    | { kind: "none" }
    | { kind: "redirect"; path: string }
    | { kind: "exitToConversation" };
}

interface CreateDecisionParams {
  navigation: VerifyRouteDecision["navigation"];
}

function createDecision({
  navigation,
}: CreateDecisionParams): VerifyRouteDecision {
  return {
    navigation,
  };
}

export function resolveVerifyRouteDecision({
  exactVerifyRoute,
  isInitialLoading,
  hasLoadError,
  conversationSlugId,
  conversation,
  surveyStatus,
  surveyForm,
  requirementState,
  emailUpdateResolution,
  routeContext = normalConversationRouteContext,
}: {
  exactVerifyRoute: boolean;
  isInitialLoading: boolean;
  hasLoadError: boolean;
  conversationSlugId: string;
  conversation: VerifyRouteConversationState | undefined;
  surveyStatus: SurveyStatusCheckResponse | undefined;
  surveyForm: SurveyFormData | undefined;
  requirementState: VerifyRouteRequirementState;
  emailUpdateResolution: ConversationEmailUpdateOnboardingResolution;
  routeContext?: ConversationRouteContext;
}): VerifyRouteDecision {
  if (!exactVerifyRoute || isInitialLoading || hasLoadError) {
    return createDecision({ navigation: { kind: "none" } });
  }

  if (conversation === undefined || surveyStatus === undefined) {
    return createDecision({ navigation: { kind: "none" } });
  }

  if (requirementState.needsAuth) {
    if (conversation.participationMode === "guest") {
      return createDecision({
        navigation: { kind: "none" },
      });
    }

    const destination = getCredentialUpgradeDestination({
      participationMode: conversation.participationMode,
    });

    const redirectPath = (() => {
      switch (destination.target) {
        case "email":
          return getConversationSurveyVerifyEmailPath({
            conversationSlugId,
            routeContext,
          });
        case "strong":
          return getConversationSurveyVerifyIdentityPath({
            conversationSlugId,
            routeContext,
          });
        case "hard":
          return getConversationSurveyVerifyHardPath({
            conversationSlugId,
            routeContext,
          });
      }
    })();

    return createDecision({
      navigation: { kind: "redirect", path: redirectPath },
    });
  }

  if (requirementState.needsTicket) {
    return createDecision({
      navigation: {
        kind: "redirect",
        path: getConversationSurveyVerifyTicketPath({
          conversationSlugId,
          routeContext,
        }),
      },
    });
  }

  if (emailUpdateResolution.status === "loading") {
    return createDecision({ navigation: { kind: "none" } });
  }

  if (
    emailUpdateResolution.status === "required" ||
    emailUpdateResolution.status === "transient_error"
  ) {
    return createDecision({
      navigation: {
        kind: "redirect",
        path: getConversationSurveyCompletePath({
          conversationSlugId,
          routeContext,
        }),
      },
    });
  }

  if (
    !surveyStatus.surveyGate.hasSurvey ||
    surveyStatus.surveyGate.status === "complete_valid"
  ) {
    return createDecision({ navigation: { kind: "exitToConversation" } });
  }

  if (surveyForm === undefined) {
    return createDecision({ navigation: { kind: "none" } });
  }

  const continuePath = getConversationSurveyContinuePath({
    conversationSlugId,
    routeResolution: surveyStatus.routeResolution,
    firstQuestionSlugId: surveyForm.questions[0]?.questionSlugId,
    routeContext,
  });

  if (
    continuePath === getConversationPath({ conversationSlugId, routeContext })
  ) {
    return createDecision({ navigation: { kind: "exitToConversation" } });
  }

  return createDecision({
    navigation: {
      kind: "redirect",
      path: continuePath,
    },
  });
}
