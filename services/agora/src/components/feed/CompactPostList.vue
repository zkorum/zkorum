<template>
  <div>
    <WidthWrapper :enable="true">
      <q-infinite-scroll
        :offset="600"
        :disable="!canLoadNextPage"
        @load="onLoad"
      >
        <PageLoadingSpinner v-if="showLoading" />

        <div
          v-if="isError && feedItems.length === 0 && !showLoading"
          class="emptyDivPadding"
        >
          <div class="centerMessage">
            <div>
              <q-icon
                :name="isOffline ? 'mdi-wifi-off' : 'mdi-alert-circle-outline'"
                size="4rem"
              />
            </div>

            <div :style="{ fontSize: '1.3rem' }">
              {{ isOffline ? t("networkErrorTitle") : t("errorStateTitle") }}
            </div>

            <div v-if="isOffline">
              {{ t("networkErrorDescription") }}
            </div>

            <ActionButton
              v-if="!isOffline"
              variant="outline"
              @click="retryFeed"
            >
              {{ t("retryButton") }}
            </ActionButton>
          </div>
        </div>

        <div
          v-else-if="feedItems.length === 0 && !showLoading && !hasNextPage"
          class="emptyDivPadding"
        >
          <div class="centerMessage">
            <div>
              <q-icon name="mdi-account-group" size="4rem" />
            </div>

            <div :style="{ fontSize: '1.3rem' }">
              {{ t("emptyStateTitle") }}
            </div>

            <div>
              {{ t("emptyStateDescription") }}
              <q-icon name="mdi-plus-circle" /> button.
            </div>
          </div>
        </div>

        <div v-else-if="feedItems.length > 0">
          <div class="postListFlex">
            <PostListItem
              v-for="feedItem in feedItems"
              :key="feedItem.conversationData.metadata.conversationSlugId"
              :conversation-data="feedItem.conversationData"
              :initial-display-content="feedItem.displayContent"
            />
          </div>
        </div>

        <PageLoadingSpinner v-if="isFetchingNextPage && feedItems.length > 0" />
        <div v-if="isError && feedItems.length > 0" class="centerMessage">
          <div>
            {{
              isOffline ? t("networkErrorDescription") : t("errorStateTitle")
            }}
          </div>
          <ActionButton v-if="!isOffline" variant="outline" @click="retryFeed">
            {{ t("retryButton") }}
          </ActionButton>
        </div>

        <div
          v-if="!isError && !hasNextPage && !isFetching && feedItems.length > 0"
          class="centerMessage"
        >
          <div>
            <q-icon name="mdi-check" size="4rem" />
          </div>

          <div :style="{ fontSize: '1.3rem' }">{{ t("completedTitle") }}</div>

          <div>{{ t("completedDescription") }}</div>
        </div>
      </q-infinite-scroll>
    </WidthWrapper>

    <NewContentPill
      v-if="isActive && hasPendingCurrentTab && !showLoading"
      :label="t('newConversationsButton')"
      @click="refreshFromTop"
    />
  </div>
</template>

<script setup lang="ts">
import { useDocumentVisibility, useWindowScroll } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { isNetworkOffline } from "src/composables/useNetworkStatus";
import { useAuthenticationStore } from "src/stores/authentication";
import { useHomeFeedStore } from "src/stores/homeFeed";
import { useFeedQuery } from "src/utils/api/post/useFeedQuery";
import {
  computed,
  onActivated,
  onDeactivated,
  ref,
  watch,
  watchPostEffect,
} from "vue";

import WidthWrapper from "../navigation/WidthWrapper.vue";
import PostListItem from "../post/list/PostListItem.vue";
import PageLoadingSpinner from "../ui/PageLoadingSpinner.vue";
import ActionButton from "../ui-library/ActionButton.vue";
import {
  type CompactPostListTranslations,
  compactPostListTranslations,
} from "./CompactPostList.i18n";
import NewContentPill from "./NewContentPill.vue";

const { hasPendingCurrentTab } = storeToRefs(useHomeFeedStore());
const { hasNewPostCheck } = useHomeFeedStore();

const documentVisibility = useDocumentVisibility();

const authStore = useAuthenticationStore();
const { isAuthInitialized } = storeToRefs(authStore);

const { y: windowY } = useWindowScroll();

const { t } = useComponentI18n<CompactPostListTranslations>(
  compactPostListTranslations
);

const isActive = ref(true);
const {
  data,
  isPending,
  isError,
  isFetching,
  refreshFeed: refreshFeedQuery,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
} = useFeedQuery({
  enabled: computed(() => isAuthInitialized.value && isActive.value),
});

const feedItems = computed(() => {
  // Live counts can move popular items across a cursor boundary between requests.
  const seen = new Set<string>();
  return (data.value?.pages ?? []).flatMap((page) =>
    page.feedItemList.filter((item) => {
      const slugId = item.conversationData.metadata.conversationSlugId;
      if (seen.has(slugId)) return false;
      seen.add(slugId);
      return true;
    })
  );
});

const isOffline = isNetworkOffline;
const canLoadNextPage = ref(false);
// Quasar resumes polling before its slot patches. Enable after the cards render
// so an empty old layout cannot trigger an unnecessary second-page request.
watchPostEffect(() => {
  canLoadNextPage.value =
    hasNextPage.value &&
    !isFetching.value &&
    !isError.value &&
    isActive.value &&
    !isOffline.value;
});

watch(isOffline, (offline, wasOffline) => {
  if (!offline && wasOffline && isError.value && isActive.value) {
    void retryFeed();
  }
});

const showLoading = computed(
  () =>
    feedItems.value.length === 0 &&
    ((isPending.value && !isError.value) || isFetching.value)
);

onActivated(async () => {
  isActive.value = true;
  await hasNewPostCheck();
});

onDeactivated(() => {
  isActive.value = false;
});

watch(documentVisibility, async () => {
  if (isActive.value && documentVisibility.value === "visible") {
    await hasNewPostCheck();
  }
});

async function onLoad(_index: number, done: () => void) {
  try {
    if (hasNextPage.value && !isFetching.value && !isOffline.value) {
      await fetchNextPage({ cancelRefetch: false });
    }
  } finally {
    done();
  }
}

async function retryFeed(): Promise<void> {
  if (isFetching.value || isOffline.value) return;
  if (isFetchNextPageError.value) await fetchNextPage({ cancelRefetch: false });
  else await refreshFeedQuery();
}

async function refreshFeed(done: () => void) {
  if (isOffline.value || !isAuthInitialized.value || !isActive.value) {
    done();
    return;
  }
  try {
    await refreshFeedQuery();
  } finally {
    done();
  }
}

async function refreshFromTop(): Promise<void> {
  windowY.value = 0;
  await refreshFeed(() => {});
}

defineExpose({
  refreshFeed,
});
</script>

<style scoped lang="scss">
.postListFlex {
  display: flex;
  flex-direction: column;
  gap: $feed-flex-gap;
}

.emptyDivPadding {
  padding-top: 5rem;
}

.centerMessage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding-top: 8rem;
  padding-bottom: 8rem;
  flex-direction: column;
}
</style>
