<template>
  <div>
    <PostViewWrapper>
      <PostItem :compact-mode="false" :extended-post-data="postData" />
    </PostViewWrapper>
  </div>
</template>

<script setup lang="ts">
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import PostItem from "src/components/feed/PostItem.vue";
import PostViewWrapper from "src/components/navigation/PostViewWrapper.vue";
import { useRoute } from "vue-router";

const route = useRoute();

const postStore = usePostStore();

let postData: DummyPostDataFormat = postStore.emptyPost;

const postSlugId = route.params.postSlugId;
if (typeof postSlugId == "string") {
  postData = postStore.getPostBySlugId(postSlugId);
}

</script>

<style scoped></style>