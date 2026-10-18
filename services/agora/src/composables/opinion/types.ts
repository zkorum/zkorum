import type { CastVoteResponse } from "src/shared/types/dto";
import type {
  DisplayedOpinionItem,
  VotingAction,
  VotingOption,
} from "src/shared/types/zod";

export interface OpinionSourceElements {
  readonly card: HTMLElement;
  readonly content: HTMLElement;
}

export interface OpinionEditRequest {
  readonly opinion: DisplayedOpinionItem;
  readonly sourceElements: OpinionSourceElements;
}

export interface UserVote {
  readonly opinionSlugId: string;
  readonly votingAction: VotingOption;
}

export interface OpinionVoteParams {
  sourceVersion: string;
  opinionSlugId: string;
  voteAction: VotingAction;
}

export interface OpinionVotingUtilities {
  userVotes: readonly UserVote[];
  castVote: (
    params: OpinionVoteParams
  ) => Promise<CastVoteResponse | undefined>;
}
