<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleBackToAuthChoice"
    :close-callback="handleBackToConversation"
  >
    <PageLoadingSpinner v-if="isInitialLoading" />

    <ErrorRetryBlock
      v-else-if="hasLoadError"
      :title="tCommon('failedToLoadSurveyTitle')"
      :retry-label="tCommon('tryAgainLabel')"
      @retry="refetchAll"
    />

    <form v-else @submit.prevent="onSubmit">
      <StepperLayout
        fixed-navigation
        :submit-call-back="onSubmit"
        :current-step="2"
        :total-steps="totalSteps"
        :enable-next-button="
          (emailInputFormRef?.getIsValid() ?? true) &&
          !isLoading &&
          nextCodeWaitSeconds === 0
        "
        :show-next-button="true"
        :show-loading-button="isLoading"
      >
        <template #header>
          <InfoHeader
            :title="t('title')"
            description=""
            icon-name="mdi-email"
          />
        </template>

        <template #body>
          <EmailInputForm ref="emailInputFormRef" @submit="submitEmail" />
          <p v-if="!isLoggedIn"><SignupAgreement variant="verify" /></p>
        </template>
      </StepperLayout>
    </form>
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import SignupAgreement from "src/components/onboarding/ui/SignupAgreement.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import EmailInputForm from "src/components/verification/EmailInputForm.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationVerificationState } from "src/composables/conversation/useConversationVerificationState";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { useEmailSubmit } from "src/composables/verification/useEmailSubmit";
import { useVerificationComplete } from "src/composables/verification/useVerificationComplete";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import {
  type VerifyEmailTranslations,
  verifyEmailTranslations,
} from "src/pages/verify/email/index.i18n";
import { useAuthenticationStore } from "src/stores/authentication";
import { useGoBackButtonHandler } from "src/utils/nav/goBackButton";
import { getConversationSurveyVerifyEmailCodePath } from "src/utils/survey/navigation";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { useNotify } from "src/utils/ui/notify";
import { ref } from "vue";
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
const { completeVerification } = useVerificationComplete();
const { showNotifyMessage } = useNotify();
const { t } = useComponentI18n<VerifyEmailTranslations>(
  verifyEmailTranslations
);
const { t: tCommon } =
  useComponentI18n<ConversationSurveyOnboardingTranslations>(
    conversationSurveyOnboardingTranslations
  );

const {
  conversationSlugId,
  credentialChoicePath: backPath,
  totalSteps,
  isInitialLoading,
  hasLoadError,
  refetchAll,
} = useConversationVerificationState({
  conversationSlugId: routeConversationSlugId,
  routeContext,
});

const { isLoading, submitEmail, nextCodeWaitSeconds } = useEmailSubmit({
  onNavigateToOtp: () =>
    router.replace({
      path: getConversationSurveyVerifyEmailCodePath({
        conversationSlugId: conversationSlugId.value,
        routeContext: routeContext.value,
      }),
    }),
  onAlreadyHasCredential: () => {
    showNotifyMessage(t("alreadyHasEmail"));
    void completeVerification();
  },
  showNotifyMessage,
  translations: {
    throttled: t("throttled"),
    unreachable: t("unreachable"),
    disposable: t("disposable"),
    somethingWrong: t("somethingWrong"),
  },
});

const emailInputFormRef = ref<{
  submit: () => boolean;
  getIsValid: () => boolean;
} | null>(null);

function onSubmit() {
  emailInputFormRef.value?.submit();
}

async function handleBackToAuthChoice(): Promise<void> {
  await safeNavigateBack({ path: backPath.value });
}

async function handleBackToConversation(): Promise<void> {
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}
</script>
