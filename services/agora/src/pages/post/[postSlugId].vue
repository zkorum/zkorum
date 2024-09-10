<template>
  <div>
    <PostDetails :extended-post-data="postData" :compact-mode="false" :show-comment-section="!showRankingView" />
  </div>
</template>

<script setup lang="ts">
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import { useRoute } from "vue-router";
import PostDetails from "src/components/post/PostDetails.vue";
import { useRouteParams } from "@vueuse/router";
import { ref, watch } from "vue";

const route = useRoute();

const postStore = usePostStore();

const displayModeString = useRouteParams("displayMode");
const showRankingView = ref(true);

updateView();

let postData: DummyPostDataFormat = postStore.emptyPost;

const postSlugId = route.params.postSlugId;
if (typeof postSlugId == "string") {
  postData = postStore.getPostBySlugId(postSlugId);
}

watch(displayModeString, () => {
  updateView();
})

function updateView() {
  // 'ranking' or 'comments'
  if (displayModeString.value == "ranking") {
    showRankingView.value = true;
  } else {
    showRankingView.value = false;
  }
}

</script>

<style scoped></style>