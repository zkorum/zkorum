import type { CastVoteResponse } from "src/shared/types/dto";
import {
  useUserVotesQuery,
  useVoteMutation,
} from "src/utils/api/vote/useVoteQueries";
import { computed, type ComputedRef } from "vue";

import type { OpinionVoteParams, UserVote } from "./types";

export interface UseOpinionVotingParams {
  postSlugId: string;
  captureAction?: () => () => boolean;
}

export interface UseOpinionVotingReturn {
  userVotes: ComputedRef<readonly UserVote[]>;
  castVote: (
    params: OpinionVoteParams
  ) => Promise<CastVoteResponse | undefined>;
  fetchUserVotingData: () => Promise<void>;
}

export function useOpinionVoting({
  postSlugId,
  captureAction,
}: UseOpinionVotingParams): UseOpinionVotingReturn {
  // Use TanStack Query for vote data
  const userVotesQuery = useUserVotesQuery({
    postSlugId,
  });

  // Use TanStack Query mutation for voting
  const voteMutation = useVoteMutation(postSlugId);

  const userVotes = computed<readonly UserVote[]>(
    () => userVotesQuery.data.value ?? []
  );

  async function castVote({
    opinionSlugId,
    voteAction,
    sourceVersion,
  }: OpinionVoteParams): Promise<CastVoteResponse | undefined> {
    const isCurrent = captureAction?.() ?? (() => true);
    const result = await voteMutation.mutateAsync({
      opinionSlugId,
      voteAction,
      sourceVersion,
      isCurrent,
    });

    return isCurrent() ? result : undefined;
  }

  async function fetchUserVotingData(): Promise<void> {
    await userVotesQuery.refetch();
  }

  return {
    userVotes,
    castVote,
    fetchUserVotingData,
  };
}
