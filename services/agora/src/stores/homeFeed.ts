import { hashKey } from "@tanstack/vue-query";
import { defineStore, storeToRefs } from "pinia";
import { FEED_HEAD_SIZE } from "src/shared/types/dto";
import type { FeedSortAlgorithm } from "src/shared/types/zod";
import { getFeedQueryScope } from "src/utils/api/post/feedQueryKey";
import { useBackendPostApi } from "src/utils/api/post/post";
import { useViewerQueryScope } from "src/utils/query/viewerScope";
import { computed, type Ref, ref, watch } from "vue";

import { useLanguageStore } from "./language";

interface FeedTabState {
  baseline: readonly string[] | undefined;
  pending: Ref<boolean>;
  check: { controller: AbortController; promise: Promise<void> } | undefined;
}

export const useHomeFeedStore = defineStore("homeFeed", () => {
  const { fetchFeedHead } = useBackendPostApi();
  const viewerScope = useViewerQueryScope();
  const { displayLanguage, spokenLanguages } = storeToRefs(useLanguageStore());
  const currentHomeFeedTab = ref<FeedSortAlgorithm>("following");
  const tabs: Record<FeedSortAlgorithm, FeedTabState> = {
    new: { baseline: undefined, pending: ref(false), check: undefined },
    following: { baseline: undefined, pending: ref(false), check: undefined },
  };
  const hasPendingCurrentTab = computed(
    () => tabs[currentHomeFeedTab.value].pending.value
  );
  const scope = computed(() =>
    hashKey(
      getFeedQueryScope({
        displayLanguage: displayLanguage.value,
        spokenLanguages: spokenLanguages.value,
        viewerScope: viewerScope.value,
      })
    )
  );

  watch(
    scope,
    () => {
      for (const tab of Object.values(tabs)) {
        tab.check?.controller.abort();
        tab.check = undefined;
        tab.baseline = undefined;
        tab.pending.value = false;
      }
    },
    { flush: "sync" }
  );

  function confirmFeedHead({
    tab,
    slugIds,
  }: {
    tab: FeedSortAlgorithm;
    slugIds: readonly string[];
  }): void {
    tabs[tab].check?.controller.abort();
    tabs[tab].check = undefined;
    tabs[tab].baseline = slugIds.slice(0, FEED_HEAD_SIZE);
    tabs[tab].pending.value = false;
  }

  function initializeFeedHead({
    tab,
    slugIds,
  }: {
    tab: FeedSortAlgorithm;
    slugIds: readonly string[];
  }): void {
    // Rebinding a cached page must not acknowledge a pending server update.
    if (tabs[tab].baseline === undefined) confirmFeedHead({ tab, slugIds });
  }

  function headChanged({
    baseline,
    incoming,
  }: {
    baseline: readonly string[];
    incoming: readonly string[];
  }): boolean {
    return (
      incoming.length !== baseline.length ||
      incoming.some((id, index) => id !== baseline[index])
    );
  }

  async function hasNewPostCheck(
    tabOverride?: FeedSortAlgorithm
  ): Promise<void> {
    const sortAlgorithm = tabOverride ?? currentHomeFeedTab.value;
    const tab = tabs[sortAlgorithm];
    const baseline = tab.baseline;
    if (baseline === undefined) return;
    if (tab.check !== undefined) return await tab.check.promise;
    const requestScope = scope.value;
    const controller = new AbortController();
    const promise = (async () => {
      try {
        const response = await fetchFeedHead({
          sortAlgorithm,
          loadPersonalizedData: viewerScope.value.userId !== undefined,
          signal: controller.signal,
        });
        if (
          controller.signal.aborted ||
          scope.value !== requestScope ||
          tab.baseline !== baseline
        )
          return;
        tab.pending.value = headChanged({
          baseline,
          incoming: response.topConversationSlugIdList,
        });
      } catch (error) {
        if (!controller.signal.aborted)
          console.error("Error checking for new posts:", error);
      }
    })();
    tab.check = { controller, promise };
    try {
      await promise;
    } finally {
      if (tab.check?.promise === promise) tab.check = undefined;
    }
  }

  function onPopularConversationUpdate(slugIds: string[]): void {
    const tab = tabs.following;
    if (tab.baseline === undefined) return;
    const changed = headChanged({ baseline: tab.baseline, incoming: slugIds });
    if (viewerScope.value.userId === undefined) {
      // The public SSE head already answers the public viewer's update check.
      tab.pending.value = changed;
    } else if (changed || tab.pending.value) {
      void hasNewPostCheck("following");
    }
  }

  return {
    currentHomeFeedTab,
    hasPendingNewTab: computed(() => tabs.new.pending.value),
    hasPendingFollowingTab: computed(() => tabs.following.pending.value),
    hasPendingCurrentTab,
    initializeFeedHead,
    confirmFeedHead,
    hasNewPostCheck,
    onPopularConversationUpdate,
  };
});
