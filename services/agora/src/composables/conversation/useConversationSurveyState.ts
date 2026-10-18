import { storeToRefs } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { useUserStore } from "src/stores/user";
import { useConversationQuery } from "src/utils/api/post/useConversationQuery";
import {
  useSurveyFormQuery,
  useSurveyStatusQuery,
} from "src/utils/api/survey/useSurveyQueries";
import { deriveSurveyRequirementState } from "src/utils/survey/requirements";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

import {
  resolveSurveyForm,
  shouldFetchSurveyForm,
  type SurveyFormLoadMode,
} from "./surveyStateLogic";

export function useConversationSurveyState({
  conversationSlugId,
  requireAccount = false,
  formLoadMode,
}: {
  conversationSlugId: MaybeRefOrGetter<string>;
  requireAccount?: boolean;
  formLoadMode: SurveyFormLoadMode;
}) {
  const conversationSlugIdValue = computed(() => toValue(conversationSlugId));
  const {
    isAuthInitialized,
    isLoggedIn,
    hasStrongVerification,
    hasEmailVerification,
  } = storeToRefs(useAuthenticationStore());
  const { verifiedEventTickets } = storeToRefs(useUserStore());

  const conversationQuery = useConversationQuery({
    conversationSlugId: conversationSlugIdValue,
    enabled: computed(() => isAuthInitialized.value),
  });
  const surveyStatusQuery = useSurveyStatusQuery({
    conversationSlugId: conversationSlugIdValue,
    enabled: computed(() => isAuthInitialized.value),
  });
  const surveyStatus = computed(() => surveyStatusQuery.data.value);
  const shouldLoadSurveyForm = computed(() =>
    shouldFetchSurveyForm({
      surveyStatus: surveyStatus.value,
      mode: formLoadMode,
    })
  );
  const surveyFormQuery = useSurveyFormQuery({
    conversationSlugId: conversationSlugIdValue,
    enabled: computed(
      () => isAuthInitialized.value && shouldLoadSurveyForm.value
    ),
  });

  const conversationData = computed(
    () => conversationQuery.data.value?.conversationData
  );
  const conversationDisplayContent = computed(
    () => conversationQuery.data.value?.displayContent
  );
  const surveyForm = computed(() => {
    return resolveSurveyForm({
      surveyStatus: surveyStatus.value,
      surveyForm: surveyFormQuery.data.value,
    });
  });
  const surveyProgress = computed<{
    conversationSlugId: string;
    total: number;
  }>((previous) => ({
    conversationSlugId: conversationSlugIdValue.value,
    // Account-scoped answers refresh after login; the progress bar must not
    // briefly treat the same questionnaire as having zero questions.
    total:
      surveyForm.value !== undefined
        ? surveyForm.value.questions.length + 2
        : surveyStatus.value?.surveyGate.hasSurvey === false
          ? 2
          : previous?.conversationSlugId === conversationSlugIdValue.value
            ? previous.total
            : 2,
  }));
  const surveyStepTotal = computed(() => surveyProgress.value.total);

  const requirementState = computed(() => {
    const conversation = conversationData.value;

    if (conversation === undefined) {
      return {
        needsAuth: false,
        needsTicket: false,
      };
    }

    return deriveSurveyRequirementState({
      // Explicit sign-in steps also serve account-only actions such as reports
      // in conversations that otherwise allow guest participation.
      participationMode:
        requireAccount && conversation.metadata.participationMode === "guest"
          ? "account_required"
          : conversation.metadata.participationMode,
      requiresEventTicket: conversation.metadata.requiresEventTicket,
      isLoggedIn: isLoggedIn.value,
      hasStrongVerification: hasStrongVerification.value,
      hasEmailVerification: hasEmailVerification.value,
      verifiedEventTicketList: Array.from(verifiedEventTickets.value),
    });
  });

  const isInitialLoading = computed(() => {
    return (
      (conversationQuery.isPending.value &&
        conversationData.value === undefined) ||
      (surveyStatusQuery.isPending.value && surveyStatus.value === undefined) ||
      (shouldLoadSurveyForm.value &&
        surveyFormQuery.isPending.value &&
        surveyForm.value === undefined)
    );
  });

  const hasLoadError = computed(() => {
    return (
      conversationQuery.isError.value ||
      surveyStatusQuery.isError.value ||
      (shouldLoadSurveyForm.value && surveyFormQuery.isError.value)
    );
  });

  async function refetchAll(): Promise<void> {
    const [, surveyStatusResult] = await Promise.all([
      conversationQuery.refetch(),
      surveyStatusQuery.refetch(),
    ]);

    if (
      shouldFetchSurveyForm({
        surveyStatus: surveyStatusResult.data,
        mode: formLoadMode,
      })
    ) {
      await surveyFormQuery.refetch();
    }
  }

  return {
    conversationSlugId: conversationSlugIdValue,
    conversationQuery,
    surveyStatusQuery,
    surveyFormQuery,
    conversationData,
    conversationDisplayContent,
    surveyStatus,
    surveyForm,
    surveyStepTotal,
    requirementState,
    isInitialLoading,
    hasLoadError,
    refetchAll,
  };
}
