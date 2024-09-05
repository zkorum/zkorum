<template>
  <div>
    <CommentRanking :post-slug-id="postData.metadata.slugId" />
  </div>
</template>

<script setup lang="ts">

import CommentRanking from "@/components/feed/CommentRanking.vue";
import { DummyPostDataFormat, usePostStore } from "@/stores/post";
import { useRoute } from "vue-router";

const route = useRoute();

const postStore = usePostStore();

let postData: DummyPostDataFormat = postStore.emptyPost;

const postSlugId = route.params.postSlugId;
if (typeof postSlugId == "string") {
  postData = postStore.getPostBySlugId(postSlugId);
}

</script>