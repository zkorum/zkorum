<template>
  <div class="pageContent">
    <Teleport v-if="isActive" to="#page-header">
      <HomeMenuBar>
        <template #center>
          <img
            v-if="drawerBehavior == 'mobile'"
            src="/images/icons/agora-wings.svg"
            class="agoraLogoStyle"
          />
        </template>
      </HomeMenuBar>

      <WidthWrapper :enable="true">
        <div class="tabCluster">
          <div class="tabItem" @click="selectedTab('following')">
            <ZKBadge
              :visible="
                hasPendingFollowingTab && currentHomeFeedTab !== 'following'
              "
            >
              <ZKTab
                :text="isLoggedIn ? t('following') : t('popular')"
                :is-highlighted="currentHomeFeedTab === 'following'"
                :should-underline-on-highlight="false"
              />
            </ZKBadge>
          </div>

          <!-- TODO: ACCESSIBILITY - Change <div> wrapper to semantic <button> or add proper ARIA attributes -->
          <!-- Tab navigation should be keyboard accessible for users with motor disabilities -->
          <div class="tabItem" @click="selectedTab('new')">
            <ZKBadge
              :visible="hasPendingNewTab && currentHomeFeedTab !== 'new'"
            >
              <ZKTab
                :text="t('new')"
                :is-highlighted="currentHomeFeedTab === 'new'"
                :should-underline-on-highlight="false"
              />
            </ZKBadge>
          </div>
        </div>
      </WidthWrapper>
    </Teleport>

    <PullToRefresh @refresh="pullDownTriggered">
      <div class="bannerWrapper">
        <WidthWrapper :enable="true">
          <FeaturedConversationBanner />
        </WidthWrapper>
      </div>

      <div class="container">
        <CompactPostList ref="compactPostListRef" />
      </div>
    </PullToRefresh>

    <NewPostButtonWrapper />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import CompactPostList from "src/components/feed/CompactPostList.vue";
import FeaturedConversationBanner from "src/components/feed/FeaturedConversationBanner.vue";
import { HomeMenuBar } from "src/components/navigation/header/variants";
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import NewPostButtonWrapper from "src/components/post/NewPostButtonWrapper.vue";
import PullToRefresh from "src/components/ui/PullToRefresh.vue";
import ZKBadge from "src/components/ui-library/ZKBadge.vue";
import ZKTab from "src/components/ui-library/ZKTab.vue";
import { usePageLayout } from "src/composables/layout/usePageLayout";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { FeedSortAlgorithm } from "src/shared/types/zod";
import { useAuthenticationStore } from "src/stores/authentication";
import { useHomeFeedStore } from "src/stores/homeFeed";
import { useNavigationStore } from "src/stores/navigation";
import { nextTick, useTemplateRef } from "vue";

import { type HomeTranslations, homeTranslations } from "./index.i18n";

defineOptions({ name: "HomePage" });

const { isActive } = usePageLayout({});

const { t } = useComponentI18n<HomeTranslations>(homeTranslations);

const { drawerBehavior } = storeToRefs(useNavigationStore());

const { currentHomeFeedTab, hasPendingNewTab, hasPendingFollowingTab } =
  storeToRefs(useHomeFeedStore());
const { isLoggedIn } = storeToRefs(useAuthenticationStore());
const compactPostListRef =
  useTemplateRef<InstanceType<typeof CompactPostList>>("compactPostListRef");

function pullDownTriggered(done: () => void): void {
  if (compactPostListRef.value) {
    void compactPostListRef.value.refreshFeed(done);
    return;
  }

  done();
}

async function selectedTab(tab: FeedSortAlgorithm): Promise<void> {
  window.scrollTo({ top: 0, behavior: "instant" });

  const hadPending =
    tab === "new" ? hasPendingNewTab.value : hasPendingFollowingTab.value;

  currentHomeFeedTab.value = tab;
  if (hadPending) {
    await nextTick();
    if (currentHomeFeedTab.value === tab)
      await compactPostListRef.value?.refreshFeed(() => {});
  }
}
</script>

<style scoped lang="scss">
.pageContent {
  padding-top: 0.5rem;
}

.bannerWrapper {
  margin-bottom: 1rem;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.agoraLogoStyle {
  width: 2rem;
  height: 1.75rem;
}

.tabCluster {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  font-weight: var(--font-weight-semibold);
  font-size: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
}

.tabItem {
  min-width: 8rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border-radius: 15px;
}

.tabItem:hover {
  cursor: pointer;
}

@media (min-width: $breakpoint-sm-min) {
  .tabCluster {
    padding-top: 1rem;
  }
}
</style>
