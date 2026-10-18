<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleBackToAuthChoice"
    :close-callback="handleBackToConversation"
  >
    <WidthWrapper :enable="true">
      <StepperLayout
        fixed-navigation
        :submit-call-back="() => {}"
        :current-step="2"
        :total-steps="surveyStepTotal"
        :enable-next-button="true"
        :show-next-button="false"
        :show-loading-button="false"
      >
        <template #header>
          <InfoHeader
            :title="t('title')"
            :description="t('description')"
            icon-name="mdi-wallet"
          />
        </template>

        <template #body>
          <RarimoVerificationForm />

          <div class="alternativeLogins">
            <ZKButton
              v-if="phoneAuthAvailability.available"
              button-type="largeButton"
              :label="t('preferPhoneVerification')"
              text-color="primary"
              @click="goToPhoneVerification()"
            />
          </div>
        </template>
      </StepperLayout>
    </WidthWrapper>
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import RarimoVerificationForm from "src/components/verification/RarimoVerificationForm.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationSurveyState } from "src/composables/conversation/useConversationSurveyState";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { useVerificationComplete } from "src/composables/verification/useVerificationComplete";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import {
  type VerifyPassportTranslations,
  verifyPassportTranslations,
} from "src/pages/verify/passport/index.i18n";
import { useAuthenticationStore } from "src/stores/authentication";
import { usePhoneAuthAvailability } from "src/utils/auth/phoneAuthMode";
import { useGoBackButtonHandler } from "src/utils/nav/goBackButton";
import {
  getConversationCredentialChoicePath,
  getConversationSurveyVerifyPath,
  getConversationSurveyVerifyPhonePath,
} from "src/utils/survey/navigation";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { useNotify } from "src/utils/ui/notify";
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

defineProps<{ sheet: DismissalController }>();

const { t } = useComponentI18n<VerifyPassportTranslations>(
  verifyPassportTranslations
);

const router = useRouter();
const { routeConversationSlugId, routeContext } =
  useConversationOnboardingRoute();
const { isAuthInitialized, isLoggedIn, credentials } = storeToRefs(
  useAuthenticationStore()
);
const phoneAuthPurpose = computed(() =>
  !isAuthInitialized.value || isLoggedIn.value ? "credential" : "login"
);
const phoneAuthAvailability = usePhoneAuthAvailability(phoneAuthPurpose);
const { safeNavigateBack } = useGoBackButtonHandler();
const { exitToConversation } = useConversationOnboardingExit();
const { completeVerification } = useVerificationComplete();
const { showNotifyMessage } = useNotify();

const {
  conversationSlugId,
  conversationData,
  surveyStepTotal,
  requirementState,
  isInitialLoading,
} = useConversationSurveyState({
  conversationSlugId: routeConversationSlugId,
  requireAccount: true,
});

const backPath = computed(() =>
  getConversationCredentialChoicePath({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
    participationMode: conversationData.value?.metadata.participationMode,
  })
);

watch(
  [isInitialLoading, requirementState],
  ([loading, requirements]) => {
    if (!loading && !requirements.needsAuth) {
      void router.replace({
        path: getConversationSurveyVerifyPath({
          conversationSlugId: conversationSlugId.value,
          routeContext: routeContext.value,
        }),
      });
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  checkExistingCredential();
});

watch(isAuthInitialized, () => {
  checkExistingCredential();
});

function checkExistingCredential() {
  if (!isAuthInitialized.value) {
    return;
  }

  if (credentials.value.rarimo !== null) {
    showNotifyMessage(t("alreadyHasPassport"));
    void completeVerification();
  }
}

async function handleBackToAuthChoice(): Promise<void> {
  await safeNavigateBack({ path: backPath.value });
}

async function goToPhoneVerification() {
  await router.replace({
    path: getConversationSurveyVerifyPhonePath({
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
</script>

<style scoped lang="scss">
.alternativeLogins {
  display: flex;
  flex-direction: column;
}
</style>
