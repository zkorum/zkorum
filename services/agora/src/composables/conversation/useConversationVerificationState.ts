import { useAuthenticationStore } from "src/stores/authentication";
import { useParticipationStatusQuery } from "src/utils/api/participation/useParticipationStatusQuery";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import { getConversationCredentialChoicePath } from "src/utils/survey/navigation";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

export function useConversationVerificationState({
  conversationSlugId,
  routeContext,
}: {
  conversationSlugId: MaybeRefOrGetter<string>;
  routeContext: MaybeRefOrGetter<ConversationRouteContext>;
}) {
  const slugId = computed(() => toValue(conversationSlugId));
  const query = useParticipationStatusQuery(slugId);
  const auth = useAuthenticationStore();
  const phoneAuthPurpose = computed(() => {
    const status = query.participationStatus.value;
    if (status.status === "onboarding_required" && "purpose" in status.nextStep)
      return status.nextStep.purpose;
    // Explicit credential-management links can be opened without a participation gate.
    return !auth.isAuthInitialized || auth.isLoggedIn ? "credential" : "login";
  });
  const credentialChoicePath = computed(() => {
    const status = query.participationStatus.value;
    return getConversationCredentialChoicePath({
      conversationSlugId: slugId.value,
      routeContext: toValue(routeContext),
      nextStep:
        status.status === "onboarding_required" ? status.nextStep : undefined,
    });
  });
  const isInitialLoading = computed(
    () => query.participationStatus.value.status === "checking"
  );
  const hasLoadError = computed(
    () => query.participationStatus.value.status === "unavailable"
  );
  async function refetchAll(): Promise<void> {
    await query.refetch();
  }
  return {
    conversationSlugId: slugId,
    credentialChoicePath,
    phoneAuthPurpose,
    totalSteps: 2,
    isInitialLoading,
    hasLoadError,
    refetchAll,
  };
}
