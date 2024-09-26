<template>
  <div>
    <PostDetails :extended-post-data="postData" :compact-mode="false" />
  </div>
</template>

<script setup lang="ts">
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import PostDetails from "src/components/post/PostDetails.vue";

const props = defineProps<{
  postSlugId: string
}>();

const postStore = usePostStore();

let postData: DummyPostDataFormat = postStore.emptyPost;
postData = postStore.getPostBySlugId(props.postSlugId);

</script>

<style scoped lang="scss">
</style>
