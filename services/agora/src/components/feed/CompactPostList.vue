<template>
  <div>
    <q-page v-if="!showfetchErrorMessage" class="container">
      <div v-if="masterPostDataList.length == 0 && dataReady" class="emptyDivPadding">
        <div class="centerMessage">
          <div>
            <q-icon name="mdi-account-group" size="4rem" />
          </div>

          <div :style="{ fontSize: '1.3rem' }">
            It is too quiet here...
          </div>

          <div>
            Create a new post using the <q-icon name="mdi-plus-circle" /> button.
          </div>
        </div>
      </div>

      <q-pull-to-refresh @refresh="refreshPage">
        <div v-if="masterPostDataList.length > 0" class="postListFlex">
          <div v-for="postData in masterPostDataList" :key="postData.metadata.slugId" class="postPadding">
            <div v-if="dataReady">
              <RouterLink :to="{
                name: 'single-post',
                params: {
                  postSlugId: postData.metadata.slugId,
                },
              }">
                <PostDetails :extended-post-data="postData" :compact-mode="true" :show-comment-section="false"
                  :skeleton-mode="false" />
              </RouterLink>
            </div>
            <div v-if="!dataReady">
              <PostDetails :extended-post-data="postData" :compact-mode="true" :show-comment-section="false"
                :skeleton-mode="true" />
            </div>
            <div class="seperator">
              <q-separator :inset="false" />
            </div>
          </div>
        </div>
      </q-pull-to-refresh>

      <div ref="bottomOfPageDiv">
      </div>

      <div v-if="endOfFeed" class="centerMessage">
        <div>
          <q-icon name="mdi-check" size="4rem" />
        </div>

        <div :style="{ fontSize: '1.3rem' }">
          You're all caught up
        </div>

        <div>
          You have seen all the new posts.
        </div>
      </div>

    </q-page>

    <div v-if="showfetchErrorMessage" class="fetchErrorMessage">
      <div>
        Failed to fetch posts from the server
      </div>

      <ZKButton label="Reload Page" color="primary" @click="loadPostData(false)" />

    </div>
  </div>
</template>

<script setup lang="ts">
import PostDetails from "../post/PostDetails.vue";
import { usePostStore } from "src/stores/post";
import ZKButton from "../ui-library/ZKButton.vue";
import { onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useElementVisibility } from "@vueuse/core";

const { lastSavedHomeFeedPosition } = storeToRefs(usePostStore());
// const { lastNavigatedRouteName } = useLastNavigatedRouteName();

const { masterPostDataList, dataReady, endOfFeed } = storeToRefs(usePostStore());
const { loadPostData } = usePostStore();

const showfetchErrorMessage = ref(false);

const bottomOfPageDiv = ref(null);
const targetIsVisible = useElementVisibility(bottomOfPageDiv);
const reachedEndOfPage = ref(false);

watch(targetIsVisible, () => {
  if (!reachedEndOfPage.value) {
    if (targetIsVisible.value) {
      loadPostData(true);
    }
  }
});

onBeforeUnmount(() => {
  lastSavedHomeFeedPosition.value = -document.body.getBoundingClientRect().top;
});

function refreshPage(done: () => void) {
  setTimeout(() => {
    loadPostData(false);
    done();
  }, 1000);
}
</script>

<style scoped>
.postListFlex {
  display: flex;
  flex-direction: column;
}

a {
  text-decoration: none;
  color: unset;
}

.seperator {
  margin-top: 1rem;
}

.postPadding {
  padding-bottom: 1rem;
}

.emptyDivPadding {
  padding-top: 5rem;
}

.fetchErrorMessage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 4rem;
  font-size: 1.2rem;
}

.container {
  padding-bottom: 20rem;
}

.centerMessage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 8rem;
  flex-direction: column;
}
</style>
