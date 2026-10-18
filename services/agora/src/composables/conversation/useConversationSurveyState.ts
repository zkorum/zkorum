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

import { resolveSurveyForm, shouldFetchSurveyForm } from "./surveyStateLogic";

export function useConversationSurveyState({
  conversationSlugId,
  requireAccount = false,
}: {
  conversationSlugId: MaybeRefOrGetter<string>;
  requireAccount?: boolean;
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
  const surveyFormQuery = useSurveyFormQuery({
    conversationSlugId: conversationSlugIdValue,
    enabled: computed(() => {
      return (
        isAuthInitialized.value &&
        shouldFetchSurveyForm({ surveyStatus: surveyStatus.value })
      );
    }),
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
  const surveyStepTotal = computed(
    () => (surveyForm.value?.questions.length ?? 0) + 2
  );

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
      (shouldFetchSurveyForm({ surveyStatus: surveyStatus.value }) &&
        surveyFormQuery.isPending.value &&
        surveyForm.value === undefined)
    );
  });

  const hasLoadError = computed(() => {
    return (
      conversationQuery.isError.value ||
      surveyStatusQuery.isError.value ||
      (shouldFetchSurveyForm({ surveyStatus: surveyStatus.value }) &&
        surveyFormQuery.isError.value)
    );
  });

  async function refetchAll(): Promise<void> {
    const [, surveyStatusResult] = await Promise.all([
      conversationQuery.refetch(),
      surveyStatusQuery.refetch(),
    ]);

    if (shouldFetchSurveyForm({ surveyStatus: surveyStatusResult.data })) {
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
