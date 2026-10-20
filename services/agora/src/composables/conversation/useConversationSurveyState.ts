import { storeToRefs } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { useConversationQuery } from "src/utils/api/post/useConversationQuery";
import {
  useSurveyFormQuery,
  useSurveyStatusQuery,
} from "src/utils/api/survey/useSurveyQueries";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

import { resolveSurveyForm, shouldFetchSurveyForm } from "./surveyStateLogic";

export function useConversationSurveyState({
  conversationSlugId,
}: {
  conversationSlugId: MaybeRefOrGetter<string>;
}) {
  const conversationSlugIdValue = computed(() => toValue(conversationSlugId));
  const { isAuthInitialized } = storeToRefs(useAuthenticationStore());

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
  const isRefreshingSurvey = computed(
    () =>
      surveyStatusQuery.fetchStatus.value !== "idle" ||
      (shouldLoadSurveyForm.value &&
        surveyFormQuery.fetchStatus.value !== "idle")
  );

  const hasLoadError = computed(() => {
    return (
      (conversationQuery.isError.value &&
        conversationData.value === undefined) ||
      (surveyStatusQuery.isError.value && surveyStatus.value === undefined) ||
      (shouldLoadSurveyForm.value &&
        surveyFormQuery.isError.value &&
        surveyForm.value === undefined)
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
    isInitialLoading,
    isRefreshingSurvey,
    hasLoadError,
    refetchAll,
  };
}
