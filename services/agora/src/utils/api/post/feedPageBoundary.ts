import {
  Dto,
  type FetchFeedRequest,
  type FetchFeedResponse,
} from "src/shared/types/dto";
import type { FeedSortAlgorithm } from "src/shared/types/zod";

export function initialFeedRequest(
  sortAlgorithm: FeedSortAlgorithm
): FetchFeedRequest {
  return sortAlgorithm === "new"
    ? { sortAlgorithm: "new", cursor: null }
    : { sortAlgorithm: "following", cursor: null };
}

export function nextFeedRequest(
  page: FetchFeedResponse
): FetchFeedRequest | undefined {
  if (page.nextCursor === null) return undefined;
  return page.sortAlgorithm === "new"
    ? { sortAlgorithm: "new", cursor: page.nextCursor }
    : { sortAlgorithm: "following", cursor: page.nextCursor };
}

export function parseFeedPage({
  request,
  rawResponse,
}: {
  request: FetchFeedRequest;
  rawResponse: unknown;
}): FetchFeedResponse {
  // OpenAPI flattens correlated cursor shapes. Parse the shared contract at the boundary.
  return Dto.fetchFeedResponse
    .refine((page) => page.sortAlgorithm === request.sortAlgorithm, {
      message: "Feed response sort does not match the requested tab",
    })
    .parse(rawResponse);
}
