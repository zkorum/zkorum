<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div class="contentLayout">
      <div class="metadata">
        {{ getTimeFromNow(commentItem.createdAt) }}
      </div>

      <div>
        <span v-html="commentItem.comment"></span>

        <div class="actionBarPaddings">
          <CommentActionBar :comment-item="commentItem" :post-slug-id="postSlugId" :is-ranked="isRanked"
            :ranked-action="rankedAction" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, PossibleCommentRankingActions } from "src/stores/post";
import { getTimeFromNow } from "src/utils/common";
import CommentActionBar from "./CommentActionBar.vue";

defineProps<{
  commentItem: DummyCommentFormat,
  postSlugId: string,
  isRanked: boolean,
  rankedAction: PossibleCommentRankingActions
}>();

</script>

<style scoped lang="scss">
.contentLayout {
  display: flex;
  flex-direction: column;
  justify-content: left;
  gap: 1rem;
}

.metadata {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;
  color: $color-text-weak;
}

.actionBarPaddings {
  padding-top: 0.5rem;
}

</style>

