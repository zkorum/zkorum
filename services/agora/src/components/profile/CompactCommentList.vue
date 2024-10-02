<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div v-for="commentItem in commentList" :key="commentItem.postSlugId">
      <ZKHoverEffect :enable-hover="true">
        <RouterLink :to="{ name: 'single-post', params: { postSlugId: commentItem.postSlugId }, query: { showComments: 'true', commentSlugId: 'comment-slug-id-1' } }">
          <div class="container">

            <div class="postTitle">
              {{ commentItem.title }}
            </div>

            <div class="commentMetadata">
              Commented {{ getTimeFromNow(commentItem.createdAt) }} ago
            </div>

            <div class="commentBody">
              <span v-html="commentItem.commentItem.comment"></span>
            </div>

            <CommentActionBar :comment-item="commentItem.commentItem" :is-ranked="commentItem.isRanked"
              :post-slug-id="commentItem.postSlugId" :ranked-action="commentItem.rankedAction" />

          </div>
        </RouterLink>
      </ZKHoverEffect>

      <Divider />
    </div>

  </div>
</template>

<script setup lang="ts">
import { useProfileStore } from "src/stores/profile";
import Divider from "primevue/divider";
import { getTimeFromNow } from "src/utils/common";
import ZKHoverEffect from "../ui-library/ZKHoverEffect.vue";
import CommentActionBar from "../post/views/CommentActionBar.vue";

const { commentList } = useProfileStore();

</script>

<style scoped lang="scss">
.postTitle {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 1.1rem;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.commentMetadata {
  color: $color-text-weak;
  font-size: 0.9rem;
}

.commentBody {
  padding-top: 0.5rem;
}
</style>
