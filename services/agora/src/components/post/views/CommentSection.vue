<template>
  <div>
    <div class="container">

      <div class="optionBar">
        <q-btn-toggle v-model="commentSortPreference" no-caps rounded unelevated
          toggle-color="color-text-weak" color="button-background-color" text-color="color-text-weak" :options="getCommentSortOptions()" />
      </div>

      <div v-for="(commentItem, index) in commentList" :key="index">
        <CommentSingle :comment-item="commentItem" :post-slug-id="postSlugId" :comment-ranking="commentRanking" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyCommentRankingFormat } from "src/stores/post";
import { useStorage } from "@vueuse/core";
import { useCommentOptions } from "src/utils/component/comments";
import CommentSingle from "./CommentSingle.vue";

defineProps<{
  commentList: DummyCommentFormat[],
  postSlugId: string,
  commentRanking: DummyCommentRankingFormat
}>();

const { getCommentSortOptions } = useCommentOptions();

const commentSortPreference = useStorage("comment-sort-preference-id", "new");

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.optionBar {
  display: flex;
  align-items: center;
  justify-content: left;
}

.optionBar:hover {
  cursor: pointer;
}

</style>
