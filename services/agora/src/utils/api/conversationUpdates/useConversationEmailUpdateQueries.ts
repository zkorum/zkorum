import { useQueryClient } from "@tanstack/vue-query";
import type { ConversationEmailUpdatePreferenceUpdateResponse } from "src/shared/types/dto";
import {
  isQueryForViewerScope,
  useViewerQueryScope,
} from "src/utils/query/viewerScope";

type PreferenceUpdateResult = Extract<
  ConversationEmailUpdatePreferenceUpdateResponse,
  { success: true }
>["result"];

export function useInvalidateParticipationAfterPreference() {
  const queryClient = useQueryClient();
  const viewerScope = useViewerQueryScope();
  return ({
    result,
    preserveConversationSlugId,
  }: {
    result: PreferenceUpdateResult;
    preserveConversationSlugId: string | undefined;
  }): void => {
    const conversations =
      result.operation === "set_conversation_preference" &&
      result.projectPreference === undefined &&
      !result.globalResumed
        ? new Set(
            result.conversationPreferences.map(
              (preference) => preference.conversationSlugId
            )
          )
        : undefined;
    // Other affected conversations refresh when next used. Preserve the snapshot
    // returned by the onboarding write instead of immediately rereading a replica.
    void queryClient.invalidateQueries({
      queryKey: ["participation-status"],
      refetchType: "none",
      predicate: (query) => {
        const slugId = query.queryKey[1];
        return (
          typeof slugId === "string" &&
          slugId !== preserveConversationSlugId &&
          (conversations === undefined || conversations.has(slugId)) &&
          isQueryForViewerScope({
            queryKey: query.queryKey,
            viewerScope: viewerScope.value,
          })
        );
      },
    });
  };
}
