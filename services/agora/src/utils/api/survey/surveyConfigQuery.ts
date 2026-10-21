import type { QueryClient } from "@tanstack/vue-query";

export async function refreshSurveyConfigQueries({
  queryClient,
  conversationSlugId,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
}): Promise<void> {
  const queryKeys = [
    "conversation",
    "participation-status",
    "survey-form",
    "survey-status",
  ].map((resource) => [resource, conversationSlugId]);

  // Invalidation alone reuses a running first fetch. Cancel pre-edit prefetches
  // too, so their late responses cannot make obsolete questionnaire data fresh.
  await Promise.all(
    queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey }))
  );
  await Promise.all(
    queryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey, refetchType: "active" })
    )
  );
}
