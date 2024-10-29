<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div class="contentLayout">
      <div class="metadata">
        {{ getTimeFromNow(new Date(commentItem.createdAt)) }}
      </div>

      <div>
        <div :class="{ highlightComment: highlight }">
          <span v-html="commentItem.comment"></span>
        </div>

        <div class="actionBarPaddings">
          <CommentActionBar :comment-item="commentItem"
            :post-slug-id="postSlugId"
            :is-ranked="isRanked"
            :ranked-action="rankedAction"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PossibleCommentRankingActions } from "src/stores/post";
import { getTimeFromNow } from "src/utils/common";
import CommentActionBar from "./CommentActionBar.vue";
import { ApiV1CommentFetchPost200ResponseInner } from "src/api";

defineProps<{
  commentItem: ApiV1CommentFetchPost200ResponseInner;
  postSlugId: string;
  isRanked: boolean;
  rankedAction: PossibleCommentRankingActions;
  highlight: boolean;
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

.highlightComment {
  background-color: #ccfbf1;
  border-radius: 15px;
  padding: 0.5rem;
}
</style>
