<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleBackToPrevious"
    :close-callback="handleBackToConversation"
  >
    <StepperLayout
      :fixed-navigation="true"
      :submit-call-back="handlePrimaryAction"
      :current-step="1"
      :total-steps="2"
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
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingPrefetch } from "src/composables/conversation/useConversationOnboardingPrefetch";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import { useParticipationStatusQuery } from "src/utils/api/participation/useParticipationStatusQuery";
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

const { participationStatus } = useParticipationStatusQuery(
  routeConversationSlugId
);
const { nextStepPath } = useConversationOnboardingPrefetch({
  conversationSlugId: routeConversationSlugId,
  routeContext,
  participationStatus,
});

const isActing = ref(false);

async function handleBackToConversation(): Promise<void> {
  await exitToConversation({
    conversationSlugId: routeConversationSlugId.value,
    routeContext: routeContext.value,
  });
}

async function handleBackToPrevious(): Promise<void> {
  await handleBackToConversation();
}

async function handlePrimaryAction(): Promise<void> {
  isActing.value = true;

  try {
    await router.push({
      path:
        nextStepPath.value ??
        getConversationSurveyVerifyPath({
          conversationSlugId: routeConversationSlugId.value,
          routeContext: routeContext.value,
        }),
    });
  } finally {
    isActing.value = false;
  }
}
</script>
