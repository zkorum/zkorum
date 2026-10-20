<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleBackToWelcome"
    :close-callback="handleBackToConversation"
  >
    <PageLoadingSpinner v-if="participationStatus.status === 'checking'" />
    <ErrorRetryBlock
      v-else-if="participationStatus.status === 'unavailable'"
      :title="t('failedToLoadSurveyTitle')"
      :retry-label="t('tryAgainLabel')"
      @retry="statusQuery.refetch()"
    />
    <StepperLayout
      v-else
      fixed-navigation
      :submit-call-back="handlePrimaryAction"
      :current-step="2"
      :total-steps="2"
      :enable-next-button="ticketStep !== undefined"
      :show-next-button="true"
      :show-loading-button="isActing"
    >
      <template #header
        ><InfoHeader
          :title="t('verifyTicketTitle')"
          :description="t('verifyTicketDescription')"
          icon-name="mdi-ticket-confirmation-outline"
      /></template>
      <template #body
        ><q-btn
          flat
          no-caps
          color="primary"
          class="ticket-card__secondary-action"
          :label="t('backToConversationLabel')"
          @click="handleBackToConversation"
      /></template>
    </StepperLayout>
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { useTicketVerificationFlow } from "src/composables/zupass/useTicketVerificationFlow";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import { useParticipationStatusQuery } from "src/utils/api/participation/useParticipationStatusQuery";
import { useGoBackButtonHandler } from "src/utils/nav/goBackButton";
import {
  getConversationSurveyOnboardingPath,
  getConversationSurveyVerifyPath,
} from "src/utils/survey/navigation";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { conversationSurveyOnboardingTranslations } from "../index.i18n";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const {
  route,
  routeConversationSlugId: conversationSlugId,
  routeContext,
} = useConversationOnboardingRoute();
const { safeNavigateBack } = useGoBackButtonHandler();
const { verifyTicket } = useTicketVerificationFlow();
const { exitToConversation } = useConversationOnboardingExit();
const { t } = useComponentI18n(conversationSurveyOnboardingTranslations);
const statusQuery = useParticipationStatusQuery(conversationSlugId);
const { participationStatus } = statusQuery;
const isActing = ref(false);
const ticketStep = computed(() => {
  const status = participationStatus.value;
  return status.status === "onboarding_required" &&
    status.nextStep.kind === "ticket"
    ? status.nextStep
    : undefined;
});
async function advance(): Promise<void> {
  await router.replace({
    path: getConversationSurveyVerifyPath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}
watch(
  [participationStatus, isActing],
  ([status, acting]) => {
    if (
      !acting &&
      route.name === "/conversation/[postSlugId].onboarding/verify/ticket" &&
      status.status !== "checking" &&
      status.status !== "unavailable" &&
      ticketStep.value === undefined
    )
      void advance();
  },
  { immediate: true }
);
async function handleBackToWelcome(): Promise<void> {
  if (isActing.value) return;
  await safeNavigateBack({
    path: getConversationSurveyOnboardingPath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}
async function handleBackToConversation(): Promise<void> {
  if (isActing.value) return;
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}
async function handlePrimaryAction(): Promise<void> {
  const step = ticketStep.value;
  if (step === undefined || isActing.value) return;
  const originatingPath = route.fullPath;
  isActing.value = true;
  try {
    const result = await verifyTicket({
      eventSlug: step.eventSlug,
      conversationSlugId: conversationSlugId.value,
    });
    if (result.success && route.fullPath === originatingPath) await advance();
  } finally {
    isActing.value = false;
  }
}
</script>

<style scoped lang="scss">
.ticket-card__secondary-action {
  align-self: flex-start;
}
</style>
