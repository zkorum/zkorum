import type { QueryClient } from "@tanstack/vue-query";
import type { UpdateConversationRequest } from "src/shared/types/dto";
import type {
  DisplayedOpinionItem,
  ExtendedOpinion,
  OpinionItem,
} from "src/shared/types/zod";
import type { OpinionCache } from "src/utils/api/comment/opinionCache";
import {
  isOpinionQueryForScope,
  type OpinionQueryScope,
} from "src/utils/api/comment/opinionQueryScope";

export function createSavedSeedOpinionChanges({
  changes,
  opinions,
}: {
  changes: NonNullable<UpdateConversationRequest["seedOpinionChanges"]>;
  opinions: readonly DisplayedOpinionItem[];
}) {
  const deleted = new Set(
    changes
      .filter((change) => change.action === "delete")
      .map((change) => change.slugId)
  );
  const edits = new Map(
    changes
      .filter((change) => change.action === "edit")
      .map((change) => [change.slugId, change.sourceVersion])
  );
  const saved = new Map(
    opinions.map((opinion) => [opinion.opinionSlugId, opinion])
  );
  function updateOpinion(current: DisplayedOpinionItem): DisplayedOpinionItem {
    const opinion = saved.get(current.opinionSlugId);
    if (opinion === undefined) return current;
    const version = current.displayContent.sourceVersion;
    return version === edits.get(current.opinionSlugId) ||
      version === opinion.displayContent.sourceVersion
      ? opinion
      : current;
  }
  function updateProfile({
    items,
    beforeSave,
  }: {
    items: ExtendedOpinion[];
    beforeSave: ReadonlyMap<string, OpinionItem>;
  }): ExtendedOpinion[] {
    return items
      .filter((item) => !deleted.has(item.opinionItem.opinionSlugId))
      .map((item) => {
        const previous = beforeSave.get(item.opinionItem.opinionSlugId);
        const opinion = saved.get(item.opinionItem.opinionSlugId);
        // The legacy profile DTO has no revision ID; compare its captured fields.
        return previous !== undefined &&
          opinion !== undefined &&
          item.opinionItem.opinion === previous.opinion &&
          item.opinionItem.updatedAt.getTime() === previous.updatedAt.getTime()
          ? { ...item, opinionItem: opinion }
          : item;
      });
  }
  function updateCache({
    queryClient,
    conversationSlugId,
    scope,
  }: {
    queryClient: QueryClient;
    conversationSlugId: string;
    scope: OpinionQueryScope;
  }): void {
    const predicate = (query: { queryKey: readonly unknown[] }) =>
      isOpinionQueryForScope({ queryKey: query.queryKey, scope });
    queryClient.setQueriesData<OpinionCache>(
      { queryKey: ["comments", conversationSlugId], predicate },
      (cache) =>
        cache === undefined
          ? undefined
          : {
              ...cache,
              pages: cache.pages.map((page) => ({
                ...page,
                items: page.items
                  .filter((opinion) => !deleted.has(opinion.opinionSlugId))
                  .map(updateOpinion),
              })),
            }
    );
    for (const slugId of deleted)
      queryClient.removeQueries({
        queryKey: ["opinionTarget", slugId],
        predicate,
      });
    for (const opinion of saved.values())
      queryClient.setQueriesData<DisplayedOpinionItem>(
        { queryKey: ["opinionTarget", opinion.opinionSlugId], predicate },
        (current) =>
          current === undefined ? undefined : updateOpinion(current)
      );
  }
  return { updateCache, updateProfile };
}
