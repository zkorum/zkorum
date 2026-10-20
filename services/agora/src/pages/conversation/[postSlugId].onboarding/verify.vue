<template>
  <ConversationOnboardingLayout
    v-if="isExactVerifyRoute"
    :sheet="sheet"
    :back-callback="handleDismiss"
    :close-callback="handleDismiss"
  >
    <ErrorRetryBlock
      v-if="
        participationStatus.status === 'unavailable' ||
        navigationState === 'failed'
      "
      :title="t('failedToLoadSurveyTitle')"
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
import { participationGateTranslations } from "src/composables/conversation/useParticipationGate.i18n";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import { useParticipationStatusQuery } from "src/utils/api/participation/useParticipationStatusQuery";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { useNotify } from "src/utils/ui/notify";
import { computed, ref, watch } from "vue";
import { isNavigationFailure, useRouter } from "vue-router";

import { conversationSurveyOnboardingTranslations } from "./index.i18n";
import { resolveVerifyRouteDecision } from "./verifyRouteLogic";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const { route, routeConversationSlugId, routeContext } =
  useConversationOnboardingRoute();
const { completeOnboarding } = useConversationOnboardingCompletion();
const { exitToConversation } = useConversationOnboardingExit();
const { t } = useComponentI18n(conversationSurveyOnboardingTranslations);
const { t: tGate } = useComponentI18n(participationGateTranslations);
const { showNotifyMessage } = useNotify();
const statusQuery = useParticipationStatusQuery(routeConversationSlugId);
const { participationStatus } = statusQuery;
const isExactVerifyRoute = computed(
  () => route.name === "/conversation/[postSlugId].onboarding/verify"
);
const navigationState = ref<"idle" | "pending" | "failed">("idle");
const routeDecision = computed(() =>
  resolveVerifyRouteDecision({
    exactVerifyRoute: isExactVerifyRoute.value,
    participationStatus: participationStatus.value,
    conversationSlugId: routeConversationSlugId.value,
    routeContext: routeContext.value,
  })
);

async function handleDismiss(): Promise<void> {
  await exitToConversation({
    conversationSlugId: routeConversationSlugId.value,
    routeContext: routeContext.value,
  });
}

async function navigateToResolvedStep(): Promise<void> {
  const navigation = routeDecision.value;
  if (navigation.kind === "none" || navigationState.value === "pending") return;
  navigationState.value = "pending";
  try {
    const params = {
      conversationSlugId: routeConversationSlugId.value,
      routeContext: routeContext.value,
    };
    let didNavigate: boolean;
    if (navigation.kind === "redirect") {
      didNavigate = !isNavigationFailure(
        await router.replace({ path: navigation.path })
      );
    } else if (navigation.kind === "complete") {
      didNavigate = await completeOnboarding(params);
    } else {
      didNavigate = await exitToConversation(params);
      if (didNavigate) showNotifyMessage(tGate("participationUnavailable"));
    }
    navigationState.value = didNavigate ? "idle" : "failed";
  } catch {
    navigationState.value = "failed";
  }
}

async function retryVerification(): Promise<void> {
  if (participationStatus.value.status === "unavailable")
    await statusQuery.refetch();
  else await navigateToResolvedStep();
}

watch(routeDecision, navigateToResolvedStep, { immediate: true });
</script>
