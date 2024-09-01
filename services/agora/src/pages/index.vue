<template>
  <div>
    <NewPostButtonWrapper @on-click="createNewPost()">
      <div class="container">
        <CompactCommunityCluster />
        <CompactPostList />
      </div>
    </NewPostButtonWrapper>
  </div>
</template>

<script setup lang="ts">
import CompactPostList from "@/components/feed/CompactPostList.vue";
import CompactCommunityCluster from "@/components/feed/CompactCommunityCluster.vue";
import NewPostButtonWrapper from "@/components/feed/NewPostButtonWrapper.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function createNewPost() {
  router.push({ name: "create-post", params: { communityId: "world" } })
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
