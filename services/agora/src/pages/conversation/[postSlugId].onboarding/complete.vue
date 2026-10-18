<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleDismiss"
    :close-callback="handleDismiss"
  >
    <ErrorRetryBlock
      v-if="surveyStatus === undefined && hasLoadError"
      compact
      :title="tSurvey('failedToLoadSurveyTitle')"
      :retry-label="tSurvey('tryAgainLabel')"
      @retry="refetchAll"
    />
    <ErrorRetryBlock
      v-if="summaryLoadState === 'transient_error'"
      compact
      :title="t('emailUpdateSummaryLoadError')"
      :retry-label="t('retryLabel')"
      @retry="loadConversationUpdateSummary"
    />
    <ConversationEmailUpdateOnboardingStep
      v-model:conversation-updates-checked="conversationUpdatesChecked"
      :title="t('emailUpdateTitle')"
      :description="t('emailUpdateDescription')"
      :continue-without-saving-label="continueWithoutSavingLabel"
      :show-conversation-updates-preference="
        onboardingPreferenceAction !== undefined
      "
      :scope-kind="conversationUpdateScopeKind"
      :is-saving="isBusy"
      @continue="handleContinue"
      @continue-without-saving="continueWithoutSaving"
    />
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import {
  type EmailUpdateResumeNotificationTranslations,
  emailUpdateResumeNotificationTranslations,
} from "src/components/conversationUpdates/emailUpdateResumeNotification.i18n";
import ConversationEmailUpdateOnboardingStep from "src/components/onboarding/ConversationEmailUpdateOnboardingStep.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import { useConversationOnboardingCompletion } from "src/composables/conversation/useConversationOnboardingCompletion";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useConversationSurveyState } from "src/composables/conversation/useConversationSurveyState";
import { useSurveyNavigation } from "src/composables/conversation/useSurveyNavigation";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import type { ConversationEmailUpdatePreferenceUpdateResponse } from "src/shared/types/dto";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { useBackendConversationEmailUpdatesApi } from "src/utils/api/conversationUpdates/conversationEmailUpdates";
import {
  type ConversationEmailUpdateOnboardingAction,
  useConversationEmailUpdateSummaryQuery,
  useRemoveConversationEmailUpdateSummaryQueries,
} from "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { useNotify } from "src/utils/ui/notify";
import { computed, ref, watch } from "vue";

import {
  type ConversationEmailUpdateOnboardingTranslations,
  conversationEmailUpdateOnboardingTranslations,
} from "./complete.i18n";
import { conversationSurveyOnboardingTranslations } from "./index.i18n";

defineProps<{ sheet: DismissalController }>();
const { t } = useComponentI18n<ConversationEmailUpdateOnboardingTranslations>(
  conversationEmailUpdateOnboardingTranslations
);
const { t: tSurvey } = useComponentI18n(
  conversationSurveyOnboardingTranslations
);
const { t: tEmailUpdateResume } =
  useComponentI18n<EmailUpdateResumeNotificationTranslations>(
    emailUpdateResumeNotificationTranslations
  );
const { exitToConversation } = useConversationOnboardingExit();
const { completeOnboarding } = useConversationOnboardingCompletion();
const conversationOnboardingStore = useConversationOnboardingStore();
const conversationEmailUpdatesApi = useBackendConversationEmailUpdatesApi();
const { navigateToNextSurveyStep } = useSurveyNavigation();
const { showNotifyMessage } = useNotify();
const { routeConversationSlugId: conversationSlugId, routeContext } =
  useConversationOnboardingRoute();

const { surveyStatus, hasLoadError, refetchAll } = useConversationSurveyState({
  conversationSlugId,
  formLoadMode: "none",
});
const emailUpdateSummaryQuery = useConversationEmailUpdateSummaryQuery({
  conversationSlugId,
  enabled: true,
});
const removeConversationEmailUpdateSummaryQueries =
  useRemoveConversationEmailUpdateSummaryQueries();
const conversationUpdatesChecked = ref(true);
const onboardingPreferenceAction = computed(() => {
  if (conversationOnboardingStore.emailUpdateConsentSkipped) return undefined;
  const resolution = emailUpdateSummaryQuery.onboardingResolution.value;
  return resolution.status === "required" ? resolution.action : undefined;
});
const onboardingPreferenceActionKey = computed(() => {
  const action = onboardingPreferenceAction.value;
  if (action === undefined) return undefined;
  return action.operation === "set_project_preference"
    ? `${action.operation}:${action.projectSlug}:${action.conversationSlugId}`
    : `${action.operation}:${action.conversationSlugId}`;
});
const summaryLoadState = computed(() => {
  const status = emailUpdateSummaryQuery.onboardingResolution.value.status;
  if (status === "loading") return "loading";
  if (status === "transient_error") return "transient_error";
  return status === "required" ? "ready" : "unavailable";
});
const isSavingConversationUpdatePreference = ref(false);
const canContinueWithoutSaving = ref(false);
const conversationUpdateScopeKind = computed(() =>
  onboardingPreferenceAction.value?.operation === "set_project_preference"
    ? "project"
    : "no-project"
);
const isBusy = computed(
  () =>
    surveyStatus.value === undefined ||
    summaryLoadState.value === "loading" ||
    summaryLoadState.value === "transient_error" ||
    isSavingConversationUpdatePreference.value
);
const continueWithoutSavingLabel = computed(() =>
  summaryLoadState.value === "transient_error" || canContinueWithoutSaving.value
    ? t("continueWithoutSavingLabel")
    : undefined
);
watch(
  onboardingPreferenceActionKey,
  () => {
    const action = onboardingPreferenceAction.value;
    conversationUpdatesChecked.value = action?.initialEnabled ?? true;
    canContinueWithoutSaving.value = false;
  },
  { immediate: true }
);

async function loadConversationUpdateSummary(): Promise<void> {
  canContinueWithoutSaving.value = false;
  await emailUpdateSummaryQuery.refetch();
}

async function handleContinue(): Promise<void> {
  if (isBusy.value) {
    return;
  }

  const onboardingAction = onboardingPreferenceAction.value;
  if (onboardingAction === undefined) {
    await continueOnboarding();
    return;
  }

  isSavingConversationUpdatePreference.value = true;
  let saveResult:
    | { saved: false }
    | {
        saved: true;
        result: Extract<
          ConversationEmailUpdatePreferenceUpdateResponse,
          { success: true }
        >["result"];
      } = { saved: false };
  try {
    saveResult = await saveConversationUpdatePreference(onboardingAction);
  } catch (error) {
    console.error("Failed to save Email Update onboarding preference", error);
  } finally {
    isSavingConversationUpdatePreference.value = false;
  }
  if (!saveResult.saved) {
    canContinueWithoutSaving.value = true;
    showPreferenceSaveError();
    return;
  }
  emailUpdateSummaryQuery.markPreferenceAnswered({
    state: conversationUpdatesChecked.value ? "enabled" : "disabled",
  });
  if (
    saveResult.result.operation !== "set_global_pause" &&
    saveResult.result.globalResumed
  ) {
    showNotifyMessage({
      message: tEmailUpdateResume("preferenceSavedAndGlobalResumed"),
      force: true,
    });
  }
  try {
    await continueOnboarding();
  } finally {
    removeConversationEmailUpdateSummaryQueries(saveResult.result);
  }
}

async function saveConversationUpdatePreference(
  action: ConversationEmailUpdateOnboardingAction
): Promise<
  | {
      saved: false;
    }
  | {
      saved: true;
      result: Extract<
        ConversationEmailUpdatePreferenceUpdateResponse,
        { success: true }
      >["result"];
    }
> {
  if (action.operation === "set_project_preference") {
    const response = await conversationEmailUpdatesApi.updatePreference({
      operation: action.operation,
      projectSlug: action.projectSlug,
      enabled: conversationUpdatesChecked.value,
      source: {
        kind: "onboarding",
        conversationSlugId: action.conversationSlugId,
      },
    });
    return response.success &&
      response.result.operation === "set_project_preference"
      ? { saved: true, result: response.result }
      : { saved: false };
  }

  const response = await conversationEmailUpdatesApi.updatePreference({
    operation: action.operation,
    conversationSlugId: action.conversationSlugId,
    enabled: conversationUpdatesChecked.value,
    source: "onboarding",
  });
  return response.success &&
    response.result.operation === "set_conversation_preference"
    ? { saved: true, result: response.result }
    : { saved: false };
}

async function handleDismiss(): Promise<void> {
  if (isSavingConversationUpdatePreference.value) return;
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}

function showPreferenceSaveError(): void {
  showNotifyMessage({
    message: t("emailUpdatePreferenceSaveError"),
    force: true,
  });
}

async function continueWithoutSaving(): Promise<void> {
  if (
    isSavingConversationUpdatePreference.value ||
    surveyStatus.value === undefined
  ) {
    return;
  }
  conversationOnboardingStore.markEmailUpdateConsentSkipped();
  await continueOnboarding();
}

async function continueOnboarding(): Promise<void> {
  const surveyGate = surveyStatus.value?.surveyGate;
  if (surveyGate === undefined) return;
  if (
    surveyGate.hasSurvey &&
    !surveyGate.isOptional &&
    !surveyGate.canParticipate
  ) {
    await navigateToNextSurveyStep({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    });
    return;
  }
  await completeOnboarding({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}
</script>
