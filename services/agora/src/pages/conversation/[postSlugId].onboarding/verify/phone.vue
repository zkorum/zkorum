<template>
  <ConversationOnboardingLayout
    v-if="!skipPhoneRegistration"
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
          phoneAuthAvailability.available &&
          !isLoading &&
          nextCodeWaitSeconds === 0
        "
        :show-next-button="phoneAuthAvailability.available"
        :show-loading-button="isLoading"
      >
        <template #header>
          <InfoHeader
            :title="t('title')"
            description=""
            icon-name="mdi-phone"
          />
        </template>

        <template #body>
          <PhoneInputForm
            ref="phoneInputFormRef"
            :purpose="phoneAuthPurpose"
            :is-loading="isLoading"
            :disabled="nextCodeWaitSeconds > 0"
            @submit="submitPhone"
          />
          <p v-if="!isLoggedIn"><SignupAgreement variant="verify" /></p>
        </template>
      </StepperLayout>
    </form>
  </ConversationOnboardingLayout>
  <PageLoadingSpinner v-else />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import SignupAgreement from "src/components/onboarding/ui/SignupAgreement.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import PhoneInputForm from "src/components/verification/PhoneInputForm.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationVerificationState } from "src/composables/conversation/useConversationVerificationState";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { usePhoneSubmit } from "src/composables/verification/usePhoneSubmit";
import { useSkipUnavailablePhoneRegistration } from "src/composables/verification/useSkipUnavailablePhoneRegistration";
import { useVerificationComplete } from "src/composables/verification/useVerificationComplete";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import {
  type VerifyPhoneTranslations,
  verifyPhoneTranslations,
} from "src/pages/verify/phone/index.i18n";
import { useAuthenticationStore } from "src/stores/authentication";
import { useGoBackButtonHandler } from "src/utils/nav/goBackButton";
import { getConversationSurveyVerifyPhoneCodePath } from "src/utils/survey/navigation";
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
const { isLoggedIn, isAuthInitialized } = storeToRefs(useAuthenticationStore());
const { safeNavigateBack } = useGoBackButtonHandler();
const { exitToConversation } = useConversationOnboardingExit();
const { completeVerification } = useVerificationComplete();
const { showNotifyMessage } = useNotify();
const phoneInputFormRef = ref<InstanceType<typeof PhoneInputForm>>();
const { t } = useComponentI18n<VerifyPhoneTranslations>(
  verifyPhoneTranslations
);
const { t: tCommon } =
  useComponentI18n<ConversationSurveyOnboardingTranslations>(
    conversationSurveyOnboardingTranslations
  );

const {
  conversationSlugId,
  phoneAuthPurpose,
  credentialChoicePath: backPath,
  totalSteps,
  isInitialLoading,
  hasLoadError,
  refetchAll,
} = useConversationVerificationState({
  conversationSlugId: routeConversationSlugId,
  routeContext,
});

const { isLoading, submitPhone, phoneAuthAvailability, nextCodeWaitSeconds } =
  usePhoneSubmit({
    purpose: phoneAuthPurpose,
    takeTurnstileToken: () => phoneInputFormRef.value?.takeTurnstileToken(),
    onNavigateToOtp: () =>
      router.replace({
        path: getConversationSurveyVerifyPhoneCodePath({
          conversationSlugId: conversationSlugId.value,
          routeContext: routeContext.value,
        }),
      }),
    onAlreadyHasCredential: () => {
      showNotifyMessage(t("alreadyHasPhone"));
      void completeVerification();
    },
    showNotifyMessage,
    translations: {
      throttled: t("throttled"),
      invalidPhoneNumber: t("invalidPhoneNumber"),
      restrictedPhoneType: t("restrictedPhoneType"),
      somethingWrong: t("somethingWrong"),
    },
  });

const skipPhoneRegistration = useSkipUnavailablePhoneRegistration({
  availability: phoneAuthAvailability,
  ready: isAuthInitialized,
  redirect: () => router.replace({ path: backPath.value }),
});

function onSubmit() {
  phoneInputFormRef.value?.submit();
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
