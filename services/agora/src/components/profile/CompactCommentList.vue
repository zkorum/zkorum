<template>
  <div>
    <div v-for="comment in commentList" :key="comment.postSlugId">
      <ZKHoverEffect :enable-hover="true">
        <RouterLink :to="{ name: 'single-post', params: { postSlugId: comment.postSlugId }, query: { commentMode: 'true', commentSlugId: 'comment-slug-id-0'} }">
          <div class="container">

            <div class="postTitle">
              {{ comment.title }}
            </div>

            <div class="commentMetadata">
              {{ comment.authorName }} • {{ getTimeFromNow(comment.createdAt) }} •
              <q-icon name="mdi-thumb-down-outline" color="color-text-weak" />
              {{ comment.numDownvotes }}
              •
              <q-icon name="mdi-thumb-up-outline" color="color-text-weak" />
              {{ comment.numUpvotes }}
            </div>

            <div class="commentBody">
              {{ comment.userComment }}
            </div>
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

const { commentList } = useProfileStore();

</script>

<style scoped lang="scss">
.postTitle {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.container {
  display:flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.commentMetadata {
  color: $color-text-weak;
  font-size: 0.9rem;
}

.commentBody {
  text-overflow: ellipsis;
  white-space: wrap;
  overflow: hidden;
  height: 3rem;
}

</style>

