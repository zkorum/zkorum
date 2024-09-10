<template>
  <div>
    <NewPostButtonWrapper @on-click="createNewPost()">
      <div class="container">
        <CompactPostList />
      </div>
    </NewPostButtonWrapper>
  </div>
</template>

<script setup lang="ts">
import CompactPostList from "src/components/feed/CompactPostList.vue";
import NewPostButtonWrapper from "src/components/feed/NewPostButtonWrapper.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function createNewPost() {
  router.push({ name: "create-post" })
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
