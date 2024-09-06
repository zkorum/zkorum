<template>
  <div>
    <NewPostButtonWrapper @on-click="createNewPost()">
      <div class="container">

        <div class="menuBar">
          <q-btn-toggle v-model="selectedCommunityId" class="my-custom-toggle" no-caps rounded toggle-color="primary"
            toggle-text-color="white" color="white" text-color="black" :options="[
              { label: 'World', value: 'world' },
              { label: 'France', value: 'france' }
            ]" />
        </div>

        <CompactPostList :community-id="selectedCommunityId" />
      </div>
    </NewPostButtonWrapper>
  </div>
</template>

<script setup lang="ts">
import CompactPostList from "src/components/feed/CompactPostList.vue";
import NewPostButtonWrapper from "src/components/feed/NewPostButtonWrapper.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const selectedCommunityId = ref("world");

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

.menuBar {
  display: flex;
  justify-content: center;
}
</style>
