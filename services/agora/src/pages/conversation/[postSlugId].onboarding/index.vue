<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleBackToPrevious"
    :close-callback="handleBackToConversation"
  >
    <PageLoadingSpinner v-if="isInitialLoading" />

    <ErrorRetryBlock
      v-else-if="hasLoadError"
      :title="t('failedToLoadSurveyTitle')"
      :retry-label="t('tryAgainLabel')"
      @retry="refetchAll"
    />

    <StepperLayout
      v-else
      :fixed-navigation="true"
      :submit-call-back="handlePrimaryAction"
      :current-step="1"
      :total-steps="surveyStepTotal"
      :enable-next-button="true"
      :show-next-button="true"
      :show-loading-button="isActing"
    >
      <template #header>
        <InfoHeader
          :title="t('welcomeTitle')"
          :description="tParticipation('description')"
          icon-name="mdi-clipboard-text-outline"
        />
      </template>
    </StepperLayout>
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import {
  type ConversationParticipationTranslations,
  conversationParticipationTranslations,
} from "src/components/onboarding/conversationParticipation.i18n";
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationSurveyState } from "src/composables/conversation/useConversationSurveyState";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import { getConversationSurveyVerifyPath } from "src/utils/survey/navigation";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { ref } from "vue";
import { useRouter } from "vue-router";

import {
  type ConversationSurveyOnboardingTranslations,
  conversationSurveyOnboardingTranslations,
} from "./index.i18n";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const { routeConversationSlugId, routeContext } =
  useConversationOnboardingRoute();
const { exitToConversation } = useConversationOnboardingExit();
const { t } = useComponentI18n<ConversationSurveyOnboardingTranslations>(
  conversationSurveyOnboardingTranslations
);
const { t: tParticipation } =
  useComponentI18n<ConversationParticipationTranslations>(
    conversationParticipationTranslations
  );

const {
  conversationSlugId,
  conversationData,
  surveyStepTotal,
  isInitialLoading,
  hasLoadError,
  refetchAll,
} = useConversationSurveyState({
  conversationSlugId: routeConversationSlugId,
  formLoadMode: "incomplete",
});

const isActing = ref(false);

async function handleBackToConversation(): Promise<void> {
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}

async function handleBackToPrevious(): Promise<void> {
  await handleBackToConversation();
}

async function handlePrimaryAction(): Promise<void> {
  if (conversationData.value === undefined) {
    await handleBackToConversation();
    return;
  }

  isActing.value = true;

  try {
    await router.push({
      path: getConversationSurveyVerifyPath({
        conversationSlugId: conversationSlugId.value,
        routeContext: routeContext.value,
      }),
    });
  } finally {
    isActing.value = false;
  }
}
</script>
