import type { SSEConversationCommentStatsUpdatedData } from "src/shared/types/dto";
import type { DisplayedOpinionItem } from "src/shared/types/zod";

export function applyOpinionVoteCountUpdate({
  opinion,
  counts,
  authorHasVote,
}: {
  opinion: DisplayedOpinionItem;
  counts: SSEConversationCommentStatsUpdatedData["opinionVoteCounts"][number];
  authorHasVote: boolean;
}): { opinion: DisplayedOpinionItem; needsPermissionRefresh: boolean } {
  const unvoted =
    counts.numAgrees + counts.numDisagrees + counts.numPasses <=
    (opinion.isSeed ? 0 : authorHasVote ? 1 : 0);
  const couldEdit =
    opinion.management?.canDelete === true &&
    unvoted &&
    !(
      opinion.moderation.status === "moderated" &&
      opinion.moderation.action === "hide"
    );
  return {
    opinion: {
      ...opinion,
      numParticipants: counts.numParticipants,
      numAgrees: counts.numAgrees,
      numDisagrees: counts.numDisagrees,
      numPasses: counts.numPasses,
      management:
        opinion.management === undefined
          ? undefined
          : {
              ...opinion.management,
              canEdit: opinion.management.canEdit && couldEdit,
            },
    },
    // Counts can revoke availability immediately, but cannot grant authorization.
    needsPermissionRefresh: couldEdit && opinion.management?.canEdit !== true,
  };
}
