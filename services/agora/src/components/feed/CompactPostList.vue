<template>
  <div>
    <q-page>
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
      <q-infinite-scroll v-if="postList.length > 0" :offset="250" @load="onLoad">
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
    </q-page>
  </div>
</template>

<script setup lang="ts">
import PostDetails from "../post/PostDetails.vue";
import { DummyPostDataFormat } from "src/stores/post";
import ZKCard from "../ui-library/ZKCard.vue";
import ZKButton from "../ui-library/ZKButton.vue";

defineProps<{
  postList: DummyPostDataFormat[];
  dataReady: boolean;
}>();

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
</style>
