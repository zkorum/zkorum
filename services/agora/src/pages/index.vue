<template>
  <div>
    <div class="container">
      <CompactCommunity />
      <CompactPostList />
    </div>
  </div>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn fab icon="mdi-plus" color="accent" @click="createNewPost()" />
  </q-page-sticky>

</template>

<script setup lang="ts">
import CompactPostList from "@/components/feed/CompactPostList.vue";
import CompactCommunity from "@/components/feed/CompactCommunity.vue";
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
