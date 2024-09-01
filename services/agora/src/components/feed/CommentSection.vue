<template>
  <div class="container">
    <div v-for="(commentItem, index) in commentList" v-bind:key="index">
      <div>
        <ZKCard>
          <div class="contentLayout">
            <PostMetadata :community-id="commentItem.communityId" :created-at="commentItem.createdAt"
              :isCompatSize="true" />
            <div>{{ commentItem.comment }}</div>
          </div>

        </ZKCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat } from "@/stores/post";
import ZKCard from "../ui-library/ZKCard.vue";
import PostMetadata from "./PostMetadata.vue";

defineProps<{
  commentList: DummyCommentFormat[]
}>()

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contentLayout {
  display: flex;
  flex-direction: column;
  justify-content: left;
  gap: 1rem;
}

.communityIconStyle {
  width: 2rem;
}
</style>