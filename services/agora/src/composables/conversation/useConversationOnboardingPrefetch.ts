import type { ParticipationStatus } from "src/utils/api/participation/useParticipationStatusQuery";
import { useSurveyPrefetch } from "src/utils/api/survey/useSurveyQueries";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import {
  getConversationOnboardingStepPath,
  getConversationSurveyVerifyPath,
} from "src/utils/survey/navigation";
import { computed, type MaybeRefOrGetter, toValue, watch } from "vue";
import { loadRouteLocation, useRouter } from "vue-router";

export function useConversationOnboardingPrefetch({
  conversationSlugId,
  routeContext,
  participationStatus,
}: {
  conversationSlugId: MaybeRefOrGetter<string>;
  routeContext: MaybeRefOrGetter<ConversationRouteContext>;
  participationStatus: MaybeRefOrGetter<ParticipationStatus>;
}) {
  const router = useRouter();
  const nextStep = computed(() => {
    const status = toValue(participationStatus);
    return status.status === "onboarding_required"
      ? status.nextStep
      : undefined;
  });
  const verifyPath = computed(() =>
    getConversationSurveyVerifyPath({
      conversationSlugId: toValue(conversationSlugId),
      routeContext: toValue(routeContext),
    })
  );
  const nextStepPath = computed(() => {
    const step = nextStep.value;
    if (step === undefined) return undefined;
    return getConversationOnboardingStepPath({
      conversationSlugId: toValue(conversationSlugId),
      routeContext: toValue(routeContext),
      nextStep: step,
    });
  });

  async function preloadRoute(path: string | undefined): Promise<void> {
    if (path === undefined) return;
    try {
      await loadRouteLocation(router.resolve(path));
    } catch {
      // Speculation must not interrupt welcome. Navigation retries the import.
    }
  }

  watch(verifyPath, preloadRoute, { immediate: true });
  watch(nextStepPath, preloadRoute, { immediate: true });
  useSurveyPrefetch({
    conversationSlugId,
    enabled: computed(() => nextStep.value?.kind === "survey"),
  });

  return { nextStepPath };
}
