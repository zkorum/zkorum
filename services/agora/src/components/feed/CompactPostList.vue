<template>
  <div>
    <q-page v-if="!showfetchErrorMessage">
      <ZKLoading :data-ready="true" />

      <div v-if="postList.length == 0 && dataReady" class="emptyDivPadding">
        <ZKCard padding="2rem">
          <div class="emptyMessage">
            <div>Whoops there is nothing here yet...</div>

            <RouterLink :to="{ name: 'create-post' }">
              <ZKButton label="Create Post" color="primary" />
            </RouterLink>
          </div>
        </ZKCard>
      </div>

      <q-pull-to-refresh @refresh="refreshPage">
        <q-infinite-scroll v-if="postList.length > 0" :offset="250" :debounce="500" @load="onLoadInfiniteScroll">
          <div class="postListFlex">
            <div v-for="(postData, index) in postList" :key="index" class="postPadding">
              <div>
                <RouterLink :to="{
                  name: 'single-post',
                  params: {
                    postSlugId: postData.metadata.slugId,
                  },
                }">
                  <PostDetails :extended-post-data="postData" :compact-mode="true" :show-comment-section="false" />
                </RouterLink>
              </div>

              <div class="seperator">
                <q-separator :inset="true" />
              </div>
            </div>
          </div>
        </q-infinite-scroll>
      </q-pull-to-refresh>
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
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import ZKCard from "../ui-library/ZKCard.vue";
import ZKButton from "../ui-library/ZKButton.vue";
import { onMounted, onBeforeUnmount, ref } from "vue";
import { storeToRefs } from "pinia";
import { useLastNavigatedRouteName } from "src/utils/nav/lastNavigatedRouteName";
import { useBackendPostApi } from "src/utils/api/post";
import ZKLoading from "../ui-library/ZKLoading.vue";

const postStore = useBackendPostApi();

const { lastSavedHomeFeedPosition } = storeToRefs(usePostStore());
const { lastNavigatedRouteName } = useLastNavigatedRouteName();

const postList = ref<DummyPostDataFormat[]>([]);

const dataReady = ref(false);

const showfetchErrorMessage = ref(false);

onMounted(async () => {
  await loadPostData(false);
});

onBeforeUnmount(() => {
  lastSavedHomeFeedPosition.value = -document.body.getBoundingClientRect().top;
});

async function loadPostData(loadMoreData: boolean) {

  let createdAtThreshold = new Date();

  if (loadMoreData) {
    const lastPostItem = postList.value.at(-1);
    if (lastPostItem) {
      createdAtThreshold = lastPostItem.metadata.createdAt;
    }
  }

  const response = await postStore.fetchRecentPost(createdAtThreshold.toISOString());
  if (response != null) {
    showfetchErrorMessage.value = false;

    // console.log("Loaded posts: " + response.length.toString());

    if (loadMoreData) {
      postList.value.push(...response);
    } else {
      postList.value = response;
    }

    dataReady.value = true;

    if (lastNavigatedRouteName.value == "single-post" && !loadMoreData) {
      setTimeout(function () {
        window.scrollTo(0, lastSavedHomeFeedPosition.value);
      }, 200);
    }
  } else {
    showfetchErrorMessage.value = true;
  }
}

function refreshPage(done: () => void) {
  setTimeout(() => {
    loadPostData(false);
    done();
  }, 1000);
}

async function onLoadInfiniteScroll(index: number, done: () => void) {
  loadPostData(true);
  done();
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

.emptyMessage {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  justify-content: center;
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
</style>
