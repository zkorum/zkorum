<template>
  <ConversationOnboardingLayout
    v-if="isExactVerifyRoute"
    :sheet="sheet"
    :back-callback="handleDismiss"
    :close-callback="handleDismiss"
  >
    <ErrorRetryBlock
      v-if="hasLoadError || navigationState === 'failed'"
      :title="hasLoadError ? t('failedToLoadSurveyTitle') : t('tryAgainLabel')"
      :retry-label="t('tryAgainLabel')"
      @retry="retryVerification"
    />
    <PageLoadingSpinner v-else />
  </ConversationOnboardingLayout>
  <router-view v-else v-slot="{ Component }">
    <component :is="Component" :sheet="sheet" />
  </router-view>
</template>

<script setup lang="ts">
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import { useConversationOnboardingCompletion } from "src/composables/conversation/useConversationOnboardingCompletion";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationSurveyState } from "src/composables/conversation/useConversationSurveyState";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { useConversationEmailUpdateSummaryQuery } from "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { computed, ref, watch } from "vue";
import { isNavigationFailure, useRouter } from "vue-router";

import { conversationSurveyOnboardingTranslations } from "./index.i18n";
import { resolveVerifyRouteDecision } from "./verifyRouteLogic";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const { route, routeConversationSlugId, routeContext } =
  useConversationOnboardingRoute();
const conversationOnboardingStore = useConversationOnboardingStore();
const { completeOnboarding } = useConversationOnboardingCompletion();
const { exitToConversation } = useConversationOnboardingExit();
const { t } = useComponentI18n(conversationSurveyOnboardingTranslations);

const {
  conversationSlugId,
  conversationData,
  surveyStatus,
  surveyForm,
  requirementState,
  isInitialLoading,
  hasLoadError,
  refetchAll,
} = useConversationSurveyState({
  conversationSlugId: routeConversationSlugId,
  formLoadMode: "incomplete",
});

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

async function handleDismiss(): Promise<void> {
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}

const navigationState = ref<"idle" | "pending" | "failed">("idle");
const routeDecision = computed(() =>
  resolveVerifyRouteDecision({
    exactVerifyRoute: isExactVerifyRoute.value,
    isInitialLoading: isInitialLoading.value,
    hasLoadError: hasLoadError.value,
    conversationSlugId: conversationSlugId.value,
    conversation: conversationData.value?.metadata,
    surveyStatus: surveyStatus.value,
    surveyForm: surveyForm.value,
    requirementState: requirementState.value,
    emailUpdateResolution: emailUpdateSummaryQuery.onboardingResolution.value,
    routeContext: routeContext.value,
  })
);

async function navigateToResolvedStep(): Promise<void> {
  const { navigation } = routeDecision.value;
  if (navigation.kind === "none" || navigationState.value === "pending") return;
  navigationState.value = "pending";
  try {
    const didNavigate =
      navigation.kind === "exitToConversation"
        ? await completeOnboarding({
            conversationSlugId: conversationSlugId.value,
            routeContext: routeContext.value,
          })
        : !isNavigationFailure(await router.replace({ path: navigation.path }));
    navigationState.value = didNavigate ? "idle" : "failed";
  } catch {
    navigationState.value = "failed";
  }
}

async function retryVerification(): Promise<void> {
  if (hasLoadError.value) await refetchAll();
  else await navigateToResolvedStep();
}

watch(routeDecision, navigateToResolvedStep, { immediate: true });
</script>
