import type { QueryClient } from "@tanstack/vue-query";
import type { ConversationProjectAssignment } from "src/shared/types/zod";
import { getConversationProjectContextFromAssignment } from "src/shared/utils/conversationProject";
import { useHomeFeedStore } from "src/stores/homeFeed";
import { useUserStore } from "src/stores/user";

import { updateConversationQueryCache } from "./useConversationQuery";

export async function applyConversationProjectAssignment({
  queryClient,
  conversationSlugId,
  assignment,
  refreshConversation = false,
  isCurrent,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
  assignment: ConversationProjectAssignment;
  refreshConversation?: boolean;
  isCurrent?: () => boolean;
}): Promise<void> {
  if (refreshConversation)
    await queryClient.invalidateQueries({
      queryKey: ["conversation", conversationSlugId],
    });
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["projectPage", assignment.previousProjectSlug],
    }),
    queryClient.invalidateQueries({
      queryKey: ["projectPage", assignment.projectSlug],
    }),
    queryClient.invalidateQueries({
      queryKey: ["projectConversationPage"],
      predicate: (query) => query.queryKey[2] === conversationSlugId,
    }),
    queryClient.invalidateQueries({
      queryKey: ["conversationEmailUpdateSummary"],
      predicate: (query) => query.queryKey[3] === conversationSlugId,
    }),
    queryClient.invalidateQueries({ queryKey: ["feed"] }),
    queryClient.invalidateQueries({
      queryKey: ["exportHistory", conversationSlugId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["exportReadiness", conversationSlugId],
    }),
    queryClient.resetQueries({
      queryKey: ["analysisFrameManifest", conversationSlugId],
    }),
    queryClient.resetQueries({
      queryKey: ["comments", conversationSlugId, "hidden"],
    }),
    queryClient.resetQueries({
      queryKey: ["survey-results-aggregated", conversationSlugId],
    }),
    ...[
      "analysis",
      "analysisMetadata",
      "analysisContent",
      "analysisFrameGroups",
      "analysisFrameOpinionList",
      "survey-completion-counts",
    ].map((family) =>
      queryClient.invalidateQueries({ queryKey: [family, conversationSlugId] })
    ),
  ]);
  if (isCurrent?.() === false) return;
  useHomeFeedStore().applyProjectAssignment({ conversationSlugId, assignment });
  useUserStore().applyProjectAssignment({ conversationSlugId, assignment });
  updateConversationQueryCache({
    queryClient,
    conversationSlugId,
    updateConversation: (conversation) => ({
      ...conversation,
      metadata: {
        ...conversation.metadata,
        projectContext: getConversationProjectContextFromAssignment({
          assignment,
          conversationSlugId,
        }),
      },
    }),
  });
}
