<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleBackToWelcome"
    :close-callback="handleBackToConversation"
  >
    <PageLoadingSpinner v-if="isInitialLoading" />

    <ErrorRetryBlock
      v-else-if="hasLoadError"
      :title="tCommon('failedToLoadSurveyTitle')"
      :retry-label="tCommon('tryAgainLabel')"
      @retry="refetchAll"
    />

    <StepperLayout
      v-else
      fixed-navigation
      :submit-call-back="() => {}"
      :current-step="2"
      :total-steps="totalSteps"
      :enable-next-button="true"
      :show-next-button="false"
      :show-loading-button="false"
    >
      <template #header>
        <InfoHeader
          :title="t('title')"
          :description="t('description')"
          icon-name="mdi-account-check"
        />
      </template>

      <template #body>
        <div class="buttons">
          <ZKGradientButton
            :label="t('verifyWithRarimo')"
            @click="goToPassport()"
          />

          <ZKGradientButton
            v-if="phoneAuthAvailability.available"
            :label="t('verifyWithPhone')"
            gradient-background="#E7E7FF"
            label-color="#6b4eff"
            @click="goToPhone()"
          />
          <PhoneAuthUnavailableNotice
            v-else-if="phoneAuthAvailability.reason === 'technical_unavailable'"
            :reason="phoneAuthAvailability.reason"
          />

          <ZKGradientButton
            :label="t('verifyWithEmail')"
            gradient-background="#E7E7FF"
            label-color="#6b4eff"
            @click="goToEmail()"
          />
        </div>

        <p v-if="!isLoggedIn"><SignupAgreement variant="login" /></p>
      </template>
    </StepperLayout>
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import SignupAgreement from "src/components/onboarding/ui/SignupAgreement.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import ZKGradientButton from "src/components/ui-library/ZKGradientButton.vue";
import PhoneAuthUnavailableNotice from "src/components/verification/PhoneAuthUnavailableNotice.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationVerificationState } from "src/composables/conversation/useConversationVerificationState";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import {
  type VerifyHardTranslations,
  verifyHardTranslations,
} from "src/pages/verify/hard/index.i18n";
import { useAuthenticationStore } from "src/stores/authentication";
import { usePhoneAuthAvailability } from "src/utils/auth/phoneAuthMode";
import { useGoBackButtonHandler } from "src/utils/nav/goBackButton";
import {
  getConversationSurveyOnboardingPath,
  getConversationSurveyVerifyEmailPath,
  getConversationSurveyVerifyPassportPath,
  getConversationSurveyVerifyPhonePath,
} from "src/utils/survey/navigation";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { useRouter } from "vue-router";

import {
  type ConversationSurveyOnboardingTranslations,
  conversationSurveyOnboardingTranslations,
} from "../index.i18n";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const { routeConversationSlugId, routeContext } =
  useConversationOnboardingRoute();
const { isLoggedIn } = storeToRefs(useAuthenticationStore());
const { safeNavigateBack } = useGoBackButtonHandler();
const { exitToConversation } = useConversationOnboardingExit();
const { t } = useComponentI18n<VerifyHardTranslations>(verifyHardTranslations);
const { t: tCommon } =
  useComponentI18n<ConversationSurveyOnboardingTranslations>(
    conversationSurveyOnboardingTranslations
  );

const {
  conversationSlugId,
  phoneAuthPurpose,
  totalSteps,
  isInitialLoading,
  hasLoadError,
  refetchAll,
} = useConversationVerificationState({
  conversationSlugId: routeConversationSlugId,
  routeContext,
});
const phoneAuthAvailability = usePhoneAuthAvailability(phoneAuthPurpose);

async function handleBackToWelcome(): Promise<void> {
  await safeNavigateBack({
    path: getConversationSurveyOnboardingPath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}

async function handleBackToConversation(): Promise<void> {
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}

async function goToPassport(): Promise<void> {
  await router.push({
    path: getConversationSurveyVerifyPassportPath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}

async function goToPhone(): Promise<void> {
  await router.push({
    path: getConversationSurveyVerifyPhonePath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}

async function goToEmail(): Promise<void> {
  await router.push({
    path: getConversationSurveyVerifyEmailPath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}
</script>

<style scoped lang="scss">
.buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
