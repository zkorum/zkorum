import type { QueryClient } from "@tanstack/vue-query";
import type {
  OpinionVoteParams,
  UserVote,
} from "src/composables/opinion/types";
import type { DisplayedOpinionItem } from "src/shared/types/zod";
import type { UserVotesQueryKey } from "src/utils/query/conversationQueryKeys";

import { mapCachedOpinions, type OpinionCache } from "../comment/opinionCache";

type VoteCounts = Readonly<
  Pick<DisplayedOpinionItem, "numAgrees" | "numDisagrees" | "numPasses">
>;

export interface VoteCacheSnapshot {
  readonly opinionSlugId: string;
  readonly before: UserVote | undefined;
  readonly after: UserVote | undefined;
  readonly counts: readonly {
    readonly before: VoteCounts;
    readonly after: VoteCounts;
  }[];
}

function countsOf(opinion: DisplayedOpinionItem): VoteCounts {
  return {
    numAgrees: opinion.numAgrees,
    numDisagrees: opinion.numDisagrees,
    numPasses: opinion.numPasses,
  };
}

function sameCounts({
  left,
  right,
}: {
  left: VoteCounts;
  right: VoteCounts;
}): boolean {
  return (
    left.numAgrees === right.numAgrees &&
    left.numDisagrees === right.numDisagrees &&
    left.numPasses === right.numPasses
  );
}

function changeVoteCounts({
  counts,
  before,
  after,
}: {
  counts: VoteCounts;
  before: UserVote | undefined;
  after: UserVote | undefined;
}): VoteCounts {
  return {
    numAgrees: Math.max(
      0,
      counts.numAgrees +
        Number(after?.votingAction === "agree") -
        Number(before?.votingAction === "agree")
    ),
    numDisagrees: Math.max(
      0,
      counts.numDisagrees +
        Number(after?.votingAction === "disagree") -
        Number(before?.votingAction === "disagree")
    ),
    numPasses: Math.max(
      0,
      counts.numPasses +
        Number(after?.votingAction === "pass") -
        Number(before?.votingAction === "pass")
    ),
  };
}

function setVote({
  votes,
  opinionSlugId,
  vote,
}: {
  votes: readonly UserVote[];
  opinionSlugId: string;
  vote: UserVote | undefined;
}): UserVote[] {
  const remaining = votes.filter(
    (existing) => existing.opinionSlugId !== opinionSlugId
  );
  return vote === undefined ? remaining : [...remaining, vote];
}

export function applyOptimisticVote({
  queryClient,
  votesKey,
  params,
}: {
  queryClient: QueryClient;
  votesKey: UserVotesQueryKey;
  params: Pick<OpinionVoteParams, "opinionSlugId" | "voteAction">;
}): VoteCacheSnapshot {
  const conversationSlugId = votesKey[1];
  const oldVotes = queryClient.getQueryData<UserVote[]>(votesKey) ?? [];
  const before = oldVotes.find(
    (vote) => vote.opinionSlugId === params.opinionSlugId
  );
  const after: UserVote | undefined =
    params.voteAction === "cancel"
      ? undefined
      : {
          opinionSlugId: params.opinionSlugId,
          votingAction: params.voteAction,
        };
  const counts: Array<{ before: VoteCounts; after: VoteCounts }> = [];
  queryClient.setQueryData(
    votesKey,
    setVote({
      votes: oldVotes,
      opinionSlugId: params.opinionSlugId,
      vote: after,
    })
  );
  queryClient.setQueriesData<OpinionCache>(
    {
      queryKey: ["comments", conversationSlugId],
      predicate: (query) => query.queryKey[3] === votesKey[2],
    },
    (cache) =>
      mapCachedOpinions({
        cache,
        mapOpinion: (opinion) => {
          if (opinion.opinionSlugId !== params.opinionSlugId) return opinion;
          const previous = countsOf(opinion);
          const next = changeVoteCounts({ counts: previous, before, after });
          counts.push({ before: previous, after: next });
          return { ...opinion, ...next };
        },
      })
  );
  return { opinionSlugId: params.opinionSlugId, before, after, counts };
}

export function restoreVoteCache({
  queryClient,
  votesKey,
  snapshot,
  vote,
}: {
  queryClient: QueryClient;
  votesKey: UserVotesQueryKey;
  snapshot: VoteCacheSnapshot;
  vote: UserVote | undefined;
}): void {
  const conversationSlugId = votesKey[1];
  const votes = queryClient.getQueryData<UserVote[]>(votesKey);
  // Auth cleanup may have discarded this viewer's cache while saving.
  if (votes === undefined) return;
  const currentVote = votes.find(
    (vote) => vote.opinionSlugId === snapshot.opinionSlugId
  );
  // A newer vote or refetch may already have replaced this optimistic value.
  if (currentVote?.votingAction !== snapshot.after?.votingAction) return;
  queryClient.setQueryData<UserVote[]>(
    votesKey,
    setVote({
      votes,
      opinionSlugId: snapshot.opinionSlugId,
      vote,
    })
  );
  // Restore this statement only. Whole-page snapshots would erase other votes
  // or live updates that arrived while the request was in flight.
  queryClient.setQueriesData<OpinionCache>(
    {
      queryKey: ["comments", conversationSlugId],
      predicate: (query) => query.queryKey[3] === votesKey[2],
    },
    (cache) =>
      mapCachedOpinions({
        cache,
        mapOpinion: (opinion) => {
          if (opinion.opinionSlugId !== snapshot.opinionSlugId) return opinion;
          const previous = snapshot.counts.find((counts) =>
            sameCounts({ left: counts.after, right: opinion })
          );
          if (previous === undefined) return opinion;
          // Earlier optimistic choices may have failed too. Restore the last
          // acknowledged vote rather than another unconfirmed choice.
          return {
            ...opinion,
            ...changeVoteCounts({
              counts: previous.before,
              before: snapshot.before,
              after: vote,
            }),
          };
        },
      })
  );
}

export function confirmVoteCache({
  queryClient,
  votesKey,
  snapshot,
}: {
  queryClient: QueryClient;
  votesKey: UserVotesQueryKey;
  snapshot: VoteCacheSnapshot;
}): void {
  queryClient.setQueryData<UserVote[]>(votesKey, (votes) =>
    setVote({
      votes: votes ?? [],
      opinionSlugId: snapshot.opinionSlugId,
      vote: snapshot.after,
    })
  );
}
