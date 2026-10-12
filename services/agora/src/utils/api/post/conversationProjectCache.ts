import type { QueryClient } from "@tanstack/vue-query";
import type { ConversationProjectAssignment } from "src/shared/types/zod";
import { getConversationProjectContextFromAssignment } from "src/shared/utils/conversationProject";
import { useHomeFeedStore } from "src/stores/homeFeed";
import { useUserStore } from "src/stores/user";
import { getErrorLogContext } from "src/utils/api/errorLog";
import type { ViewerQueryScope } from "src/utils/query/viewerScope";

import {
  type ConversationDetailData,
  updateConversationQueryCache,
} from "./useConversationQuery";

export async function applyConversationProjectAssignment({
  queryClient,
  conversationSlugId,
  assignment,
  refreshConversation = false,
  isCurrent,
  refreshMetadata,
  viewerScope,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
  assignment: ConversationProjectAssignment;
  refreshConversation?: boolean;
  isCurrent?: () => boolean;
  refreshMetadata?: () => Promise<ConversationDetailData | undefined>;
  viewerScope?: ViewerQueryScope;
}): Promise<void> {
  if (isCurrent?.() === false) return;
  function apply(freshConversation?: ConversationDetailData): void {
    useHomeFeedStore().applyProjectAssignment({
      conversationSlugId,
      assignment,
      freshConversation,
    });
    useUserStore().applyProjectAssignment({
      conversationSlugId,
      assignment,
      freshConversation,
    });
    updateConversationQueryCache({
      queryClient,
      conversationSlugId,
      viewerScope: freshConversation === undefined ? undefined : viewerScope,
      updateConversation: (conversation) => ({
        ...conversation,
        interaction: freshConversation?.interaction ?? conversation.interaction,
        metadata: freshConversation?.metadata ?? {
          ...conversation.metadata,
          currentProjectSlug: assignment.projectSlug,
          projectContext: getConversationProjectContextFromAssignment({
            assignment,
            conversationSlugId,
            currentContext: conversation.metadata.projectContext,
          }),
        },
      }),
    });
  }
  apply();
  try {
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
        queryClient.invalidateQueries({
          queryKey: [family, conversationSlugId],
        })
      ),
    ]);
    if (isCurrent?.() === false) return;
    const freshConversation = await refreshMetadata?.();
    if (isCurrent?.() === false) return;
    apply(
      freshConversation?.metadata.currentProjectSlug === assignment.projectSlug
        ? freshConversation
        : undefined
    );
  } catch (error: unknown) {
    if (isCurrent?.() !== false) apply();
    console.error(
      "Failed to refresh conversation project caches",
      getErrorLogContext(error)
    );
  }
  // A projected scope must not make partially refreshed ownership data look fresh.
  if (isCurrent?.() !== false)
    void queryClient.invalidateQueries({
      queryKey: ["conversation", conversationSlugId],
      refetchType: "none",
    });
}
