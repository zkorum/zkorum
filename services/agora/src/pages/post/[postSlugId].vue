<template>
  <div>
    <PostDetails :extended-post-data="postData" :compact-mode="false" :show-comment-section="!showRankingView" />
  </div>
</template>

<script setup lang="ts">
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import PostDetails from "src/components/post/PostDetails.vue";
import { ref, watch } from "vue";

const props = defineProps<{
  postSlugId: string
  displayMode: "ranking" | ""
}>()

const postStore = usePostStore();

const showRankingView = ref(true);

updateView();

let postData: DummyPostDataFormat = postStore.emptyPost;
postData = postStore.getPostBySlugId(props.postSlugId);

watch(() => props.displayMode, () => {
  updateView();
})

function updateView() {
  if (props.displayMode == "ranking") {
    showRankingView.value = true;
  } else {
    showRankingView.value = false;
  }
}

</script>

<style scoped></style>