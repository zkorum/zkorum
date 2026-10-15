import { type InfiniteData, useInfiniteQuery } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { useLanguageStore } from "src/stores/language";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

import { useBackendCommentApi } from "./comment";
import {
  initialOpinionPageRequest,
  type OpinionPageRequest,
  type OpinionPageResult,
} from "./opinionPageBoundary";

export function usePagedCommentsQuery({
  conversationSlugId,
  filter,
  enabled = true,
}: {
  conversationSlugId: MaybeRefOrGetter<string>;
  filter: MaybeRefOrGetter<OpinionPageRequest["filter"]>;
  enabled?: MaybeRefOrGetter<boolean>;
}) {
  const { fetchOpinionPage } = useBackendCommentApi();
  const { displayLanguage, spokenLanguages } = storeToRefs(useLanguageStore());
  const { userId } = storeToRefs(useAuthenticationStore());

  return useInfiniteQuery<
    OpinionPageResult,
    Error,
    InfiniteData<OpinionPageResult, OpinionPageRequest>,
    readonly unknown[],
    OpinionPageRequest
  >({
    queryKey: [
      "comments",
      computed(() => toValue(conversationSlugId)),
      computed(() => toValue(filter)),
      userId,
      displayLanguage,
      computed(() => [...spokenLanguages.value].sort()),
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchOpinionPage({ ...pageParam, signal }),
    enabled: computed(
      () => toValue(enabled) && toValue(conversationSlugId) !== ""
    ),
    initialPageParam: computed(() =>
      initialOpinionPageRequest({
        conversationSlugId: toValue(conversationSlugId),
        filter: toValue(filter),
      })
    ),
    getNextPageParam: (lastPage) => lastPage.nextRequest,
    staleTime: 30_000,
    retry: false,
  });
}
