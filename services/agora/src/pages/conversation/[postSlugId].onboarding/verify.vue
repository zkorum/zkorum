<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" :sheet="sheet" />
  </router-view>
</template>

<script setup lang="ts">
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationSurveyState } from "src/composables/conversation/useConversationSurveyState";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { useConversationEmailUpdateSummaryQuery } from "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

import { resolveVerifyRouteDecision } from "./verifyRouteLogic";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const { route, routeConversationSlugId, routeContext } =
  useConversationOnboardingRoute();
const conversationOnboardingStore = useConversationOnboardingStore();
const { exitToConversation } = useConversationOnboardingExit();

const {
  conversationSlugId,
  conversationData,
  surveyStatus,
  surveyForm,
  requirementState,
  isInitialLoading,
  hasLoadError,
} = useConversationSurveyState({ conversationSlugId: routeConversationSlugId });

const shouldResolveEmailUpdateConsent = computed(() => {
  const surveyGate = surveyStatus.value?.surveyGate;
  const requiredSurveyIsBlocking =
    surveyGate?.hasSurvey === true &&
    !surveyGate.isOptional &&
    !surveyGate.canParticipate;
  return (
    conversationData.value !== undefined &&
    surveyStatus.value !== undefined &&
    !conversationOnboardingStore.emailUpdateConsentSkipped &&
    !requirementState.value.needsAuth &&
    !requirementState.value.needsTicket &&
    (conversationOnboardingStore.isResumeMode || requiredSurveyIsBlocking)
  );
});
const emailUpdateSummaryQuery = useConversationEmailUpdateSummaryQuery({
  conversationSlugId: routeConversationSlugId,
  enabled: shouldResolveEmailUpdateConsent,
});

const isExactVerifyRoute = computed(() => {
  const routeName = String(route.name ?? "");
  return routeName === "/conversation/[postSlugId].onboarding/verify";
});

watch(
  [
    isExactVerifyRoute,
    isInitialLoading,
    hasLoadError,
    conversationData,
    surveyStatus,
    surveyForm,
    requirementState,
    emailUpdateSummaryQuery.onboardingResolution,
  ],
  ([
    exactVerifyRoute,
    loading,
    loadError,
    conversation,
    statusData,
    formData,
    requirements,
    emailUpdateResolution,
  ]) => {
    const decision = resolveVerifyRouteDecision({
      exactVerifyRoute: exactVerifyRoute,
      isInitialLoading: loading,
      hasLoadError: loadError,
      conversationSlugId: conversationSlugId.value,
      conversation:
        conversation === undefined
          ? undefined
          : {
              participationMode: conversation.metadata.participationMode,
            },
      surveyStatus: statusData,
      surveyForm: formData,
      requirementState: requirements,
      emailUpdateResolution,
      routeContext: routeContext.value,
    });

    if (decision.navigation.kind === "none") {
      return;
    }

    if (decision.navigation.kind === "exitToConversation") {
      void exitToConversation({
        conversationSlugId: conversationSlugId.value,
        routeContext: routeContext.value,
      });
      return;
    }

    void router.replace({
      path: decision.navigation.path,
    });
  },
  { immediate: true }
);
</script>
