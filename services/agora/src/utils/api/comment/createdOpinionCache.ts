import type { QueryClient } from "@tanstack/vue-query";
import type { UserVote } from "src/composables/opinion/types";
import type { DisplayedOpinionItem } from "src/shared/types/zod";

import { type OpinionCache, prependCachedOpinion } from "./opinionCache";

export async function cacheCreatedSeedOpinions({
  queryClient,
  conversationSlugId,
  opinions,
  viewerUserId,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
  opinions: readonly DisplayedOpinionItem[];
  viewerUserId: string | undefined;
}): Promise<void> {
  if (opinions.length === 0 || viewerUserId === undefined) return;
  const commentsKey = ["comments", conversationSlugId];
  await queryClient.cancelQueries({
    queryKey: commentsKey,
    predicate: ({ queryKey }) => queryKey[3] === viewerUserId,
  });
  const ids = new Set(opinions.map((opinion) => opinion.opinionSlugId));
  const newestFirst = [...opinions].reverse();
  queryClient.setQueriesData<OpinionCache>(
    {
      queryKey: commentsKey,
      predicate: ({ queryKey }) =>
        ["discover", "new", "my_statements"].includes(String(queryKey[2])) &&
        queryKey[3] === viewerUserId,
    },
    (oldData) => {
      if (oldData === undefined) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page, index) => {
          const remaining = page.items.filter(
            (opinion) => !ids.has(opinion.opinionSlugId)
          );
          return {
            ...page,
            items: index === 0 ? [...newestFirst, ...remaining] : remaining,
          };
        }),
      };
    }
  );
}

export async function cacheCreatedOpinion({
  queryClient,
  conversationSlugId,
  displayedOpinionItem,
  viewerUserId,
}: {
  queryClient: QueryClient;
  conversationSlugId: string;
  displayedOpinionItem: DisplayedOpinionItem;
  viewerUserId: string | undefined;
}): Promise<void> {
  const userVotesKey = ["userVotes", conversationSlugId, viewerUserId];
  const commentsKey = ["comments", conversationSlugId];

  // In-flight reads may predate creation; don't let them replace the confirmed write.
  await Promise.all([
    queryClient.cancelQueries({ queryKey: userVotesKey }),
    queryClient.cancelQueries({
      queryKey: commentsKey,
      predicate: ({ state }) => state.data !== undefined,
    }),
  ]);

  queryClient.setQueryData<UserVote[]>(userVotesKey, (oldData) => [
    ...(oldData?.filter(
      (vote) => vote.opinionSlugId !== displayedOpinionItem.opinionSlugId
    ) ?? []),
    {
      opinionSlugId: displayedOpinionItem.opinionSlugId,
      votingAction: "agree",
    },
  ]);

  queryClient.setQueriesData<OpinionCache>(
    {
      queryKey: commentsKey,
      predicate: ({ queryKey }) =>
        ["discover", "new", "my_votes", "my_statements"].includes(
          String(queryKey[2])
        ) && queryKey[3] === viewerUserId,
    },
    (oldData) => {
      // An unfetched lazy list must stay unfetched, rather than look complete.
      if (oldData === undefined) {
        return oldData;
      }
      return prependCachedOpinion({
        cache: oldData,
        opinion: displayedOpinionItem,
      });
    }
  );
}
