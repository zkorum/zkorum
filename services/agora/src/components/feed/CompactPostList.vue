<template>
  <div>
    <div v-if="!showfetchErrorMessage" class="container">

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
        <div>
          <div v-if="hasPendingData" class="floatingButton">
            <ZKButton icon="mdi-arrow-up" label="New" color="secondary" @click="refreshPage(() => { })" />
          </div>

          <div v-if="masterPostDataList.length > 0" class="postListFlex">
            <div v-for="postData in masterPostDataList" :key="postData.metadata.slugId">
              <PostDetails :extended-post-data="postData" :compact-mode="true" :show-comment-section="false"
                :skeleton-mode="!dataReady" class="showCursor" @click="openPost(postData.metadata.slugId)" />

              <div class="seperator">
                <q-separator :inset="false" />
              </div>
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

    </div>

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
import { useDocumentVisibility, useElementVisibility } from "@vueuse/core";
import { useRouter } from "vue-router";

const { lastSavedHomeFeedPosition } = storeToRefs(usePostStore());
// const { lastNavigatedRouteName } = useLastNavigatedRouteName();

const { masterPostDataList, dataReady, endOfFeed } = storeToRefs(usePostStore());
const { loadPostData, hasNewPosts } = usePostStore();

const router = useRouter();

const showfetchErrorMessage = ref(false);

const bottomOfPageDiv = ref(null);
const targetIsVisible = useElementVisibility(bottomOfPageDiv);
const reachedEndOfPage = ref(false);

const pageIsVisible = useDocumentVisibility();

const hasPendingData = ref(false);

watch(pageIsVisible, async () => {
  newPostCheck();
});

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

async function newPostCheck() {
  if (hasPendingData.value == false && dataReady.value && pageIsVisible.value == "visible") {
    hasPendingData.value = await hasNewPosts();
  }
}

function openPost(postSlugId: string) {
  if (dataReady.value) {
    router.push({ name: "single-post", params: { postSlugId: postSlugId } });
  }
}

function refreshPage(done: () => void) {
  hasPendingData.value = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  loadPostData(false);

  setTimeout(() => {
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
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
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
  padding-top: 0.5rem;
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

.showCursor:hover {
  cursor: pointer;
}

.floatingButton {
  position: fixed;
  bottom: 5rem;
  left: calc(50% - 4rem);
  z-index: 100;
  display: flex;
  justify-content: center;
}
</style>
