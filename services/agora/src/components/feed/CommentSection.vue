<template>
  <div class="container">
    <div v-for="(commentItem, index) in commentList" v-bind:key="index">
      <div>
        <ZKCard>
          <div class="contentLayout">
            <div class="communityIconStyle">
              <CommunityIcon :community-id="commentItem.communityId" :compact="false" />
            </div>
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
import CommunityIcon from "../community/CommunityIcon.vue";

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