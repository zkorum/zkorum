<template>
  <div>
    <q-page>
      <div v-if="postList.length == 0" class="emptyMessage">
        Whoops there are no posts here yet...
      </div>
      <q-infinite-scroll v-if="postList.length > 0" :offset="250" @load="onLoad">
        <div class="postListFlex">
          <div v-for="(postData, index) in postList" :key="index" class="postPadding">
            <div>
              <RouterLink :to="{ name: 'single-post', params: { postSlugId: postData.metadata.slugId } }">
                <PostDetails :extended-post-data="postData" :compact-mode="true" :show-comment-section="false" />
              </RouterLink>
            </div>

            <div class="seperator">
              <q-separator :inset="true" />
            </div>

          </div>

        </div>
      </q-infinite-scroll>
    </q-page>
  </div>
</template>

<script setup lang="ts">

import PostDetails from "../post/PostDetails.vue";
import { DummyPostDataFormat } from "src/stores/post";

defineProps<{
  postList: DummyPostDataFormat[]
}>();

// const FETCH_POST_COUNT = 10;
// const compactPostDataList = ref<DummyPostDataFormat[]>([]);
// let lastSlugId = "";

// generateNewPosts();

/*
function generateNewPosts() {
  const postList = fetchCuratedPosts(lastSlugId, FETCH_POST_COUNT);
  for (let i = 0; i < postList.length; i++) {
    compactPostDataList.value.push(postList[i]);
  }

  if (postList.length > 0) {
    lastSlugId = postList[postList.length - 1].metadata.slugId;
  } else {
    // Reached the end of the post list
  }
}
*/

interface DoneFunction {
  (): void;
}

async function onLoad(index: number, done: DoneFunction) {
  // generateNewPosts();
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
  color: unset
}

.seperator {
  margin-top: 1rem;
}

.postPadding {
  padding-bottom: 1rem;
}

.emptyMessage {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

</style>
