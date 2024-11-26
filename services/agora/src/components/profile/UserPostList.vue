<template>
  <div>
    <div v-for="postData in profileData.userPostList" :key="postData.metadata.postSlugId">
      <PostDetails :extended-post-data="postData" :compact-mode="true" :show-comment-section="false"
        :skeleton-mode="false" class="showCursor" :show-author="false" :display-absolute-time="true"
        @click="openPost(postData.metadata.postSlugId)" />

      <div class="seperator">
        <q-separator :inset="false" />
      </div>
    </div>

    <div ref="bottomOfPostPageDiv">
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementVisibility } from "@vueuse/core";
import PostDetails from "src/components/post/PostDetails.vue";
import { useUserStore } from "src/stores/user";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

const { loadMoreUserPosts, profileData } = useUserStore();

const router = useRouter();

const endOfFeed = ref(false);
let isExpandingPosts = false;

const bottomOfPostPageDiv = ref(null);
const targetIsVisible = useElementVisibility(bottomOfPostPageDiv);


watch(targetIsVisible, async () => {
  if (targetIsVisible.value && !isExpandingPosts && !endOfFeed.value) {
    isExpandingPosts = true;

    const response = await loadMoreUserPosts();
    endOfFeed.value = response.reachedEndOfFeed;

    isExpandingPosts = false;
  }
});

function openPost(postSlugId: string) {
  router.push({ name: "single-post", params: { postSlugId: postSlugId } });
}

</script>

<style scoped lang="scss"></style>
