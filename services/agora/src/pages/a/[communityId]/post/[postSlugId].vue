<template>
  <div>
    <PostItem :compact-mode="false" :extended-post-data="postData" />
  </div>
</template>

<script setup lang="ts">
import { usePostStore } from "@/stores/post";
import PostItem from "@/components/feed/PostItem.vue";

const postData = usePostStore().generateDummyPostData();

</script>

<style scoped></style>