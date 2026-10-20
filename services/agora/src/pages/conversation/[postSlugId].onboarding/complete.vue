<template>
  <ConversationOnboardingLayout
    :sheet="sheet"
    :back-callback="handleDismiss"
    :close-callback="handleDismiss"
  >
    <ErrorRetryBlock
      v-if="participationStatus.status === 'unavailable'"
      compact
      :title="t('emailUpdateSummaryLoadError')"
      :retry-label="t('retryLabel')"
      @retry="statusQuery.refetch()"
    />
    <ConversationEmailUpdateOnboardingStep
      v-model:conversation-updates-checked="conversationUpdatesChecked"
      :title="t('emailUpdateTitle')"
      :description="t('emailUpdateDescription')"
      :continue-without-saving-label="continueWithoutSavingLabel"
      :show-conversation-updates-preference="onboardingAction !== undefined"
      :scope-kind="conversationUpdateScopeKind"
      :is-saving="isBusy"
      @continue="handleContinue"
      @continue-without-saving="continueWithoutSaving"
    />
  </ConversationOnboardingLayout>
</template>

<script setup lang="ts">
import { emailUpdateResumeNotificationTranslations } from "src/components/conversationUpdates/emailUpdateResumeNotification.i18n";
import ConversationEmailUpdateOnboardingStep from "src/components/onboarding/ConversationEmailUpdateOnboardingStep.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import { useConversationOnboardingExit } from "src/composables/conversation/useConversationOnboardingExit";
import { useConversationOnboardingRoute } from "src/composables/conversation/useConversationOnboardingRoute";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import ConversationOnboardingLayout from "src/layouts/ConversationOnboardingLayout.vue";
import type { ConversationOnboardingPreferenceSaveResponse } from "src/shared/types/dto";
import { useAuthenticationStore } from "src/stores/authentication";
import { useConversationOnboardingStore } from "src/stores/conversationOnboarding";
import { useInvalidateParticipationAfterPreference } from "src/utils/api/conversationUpdates/useConversationEmailUpdateQueries";
import { useParticipationStatusQuery } from "src/utils/api/participation/useParticipationStatusQuery";
import { useSaveOnboardingPreference } from "src/utils/api/participation/useSaveOnboardingPreference";
import { getConversationSurveyVerifyPath } from "src/utils/survey/navigation";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { useNotify } from "src/utils/ui/notify";
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { conversationEmailUpdateOnboardingTranslations } from "./complete.i18n";

defineProps<{ sheet: DismissalController }>();
const router = useRouter();
const { t } = useComponentI18n(conversationEmailUpdateOnboardingTranslations);
const { t: tResume } = useComponentI18n(
  emailUpdateResumeNotificationTranslations
);
const { exitToConversation } = useConversationOnboardingExit();
const onboarding = useConversationOnboardingStore();
const auth = useAuthenticationStore();
const {
  route,
  routeConversationSlugId: conversationSlugId,
  routeContext,
} = useConversationOnboardingRoute();
const statusQuery = useParticipationStatusQuery(conversationSlugId);
const { participationStatus } = statusQuery;
const { savePreference } = useSaveOnboardingPreference();
const invalidateOtherParticipation =
  useInvalidateParticipationAfterPreference();
const { showNotifyMessage } = useNotify();
const conversationUpdatesChecked = ref(true);
const isSaving = ref(false);
const canSkipAfterFailure = ref(false);
const onboardingAction = computed(() => {
  const status = participationStatus.value;
  return status.status === "onboarding_required" &&
    status.nextStep.kind === "email_updates"
    ? status.nextStep.action
    : undefined;
});
const conversationUpdateScopeKind = computed(() =>
  onboardingAction.value?.operation === "set_project_preference"
    ? "project"
    : "no-project"
);
const isBusy = computed(
  () => isSaving.value || participationStatus.value.status === "checking"
);
const continueWithoutSavingLabel = computed(() =>
  participationStatus.value.status === "unavailable" ||
  canSkipAfterFailure.value
    ? t("continueWithoutSavingLabel")
    : undefined
);

const onboardingActionKey = computed(() => {
  const action = onboardingAction.value;
  return action === undefined
    ? undefined
    : JSON.stringify([
        auth.userId,
        action.operation,
        action.operation === "set_project_preference"
          ? action.projectSlug
          : undefined,
        action.conversationSlugId,
      ]);
});
watch(
  onboardingActionKey,
  () => {
    conversationUpdatesChecked.value =
      onboardingAction.value?.initialEnabled ?? true;
    canSkipAfterFailure.value = false;
  },
  { immediate: true }
);

async function advance(): Promise<void> {
  await router.replace({
    path: getConversationSurveyVerifyPath({
      conversationSlugId: conversationSlugId.value,
      routeContext: routeContext.value,
    }),
  });
}

async function handleContinue(): Promise<void> {
  if (isBusy.value) return;
  const action = onboardingAction.value;
  if (action === undefined) {
    if (participationStatus.value.status !== "unavailable") await advance();
    return;
  }
  const originatingPath = route.fullPath;
  const originatingSlugId = conversationSlugId.value;
  isSaving.value = true;
  try {
    let response: ConversationOnboardingPreferenceSaveResponse | undefined;
    try {
      response = await savePreference(
        action.operation === "set_project_preference"
          ? {
              operation: action.operation,
              projectSlug: action.projectSlug,
              conversationSlugId: action.conversationSlugId,
              enabled: conversationUpdatesChecked.value,
            }
          : {
              operation: action.operation,
              conversationSlugId: action.conversationSlugId,
              enabled: conversationUpdatesChecked.value,
            }
      );
    } catch {
      if (route.fullPath !== originatingPath) return;
      canSkipAfterFailure.value = true;
      showNotifyMessage({
        message: t("emailUpdatePreferenceSaveError"),
        force: true,
      });
      return;
    }
    if (response === undefined) return;
    if (!response.success) {
      if (route.fullPath !== originatingPath) return;
      canSkipAfterFailure.value = true;
      showNotifyMessage({
        message: t("emailUpdatePreferenceSaveError"),
        force: true,
      });
      return;
    }
    invalidateOtherParticipation({
      result: response.result,
      preserveConversationSlugId: originatingSlugId,
    });
    if (route.fullPath !== originatingPath) return;
    if (
      response.result.operation !== "set_global_pause" &&
      response.result.globalResumed
    ) {
      showNotifyMessage({
        message: tResume("preferenceSavedAndGlobalResumed"),
        force: true,
      });
    }
    await advance();
  } finally {
    isSaving.value = false;
  }
}

async function continueWithoutSaving(): Promise<void> {
  if (isSaving.value) return;
  onboarding.markEmailUpdateConsentSkipped();
  await nextTick();
  await advance();
}

async function handleDismiss(): Promise<void> {
  if (isSaving.value) return;
  await exitToConversation({
    conversationSlugId: conversationSlugId.value,
    routeContext: routeContext.value,
  });
}
</script>
