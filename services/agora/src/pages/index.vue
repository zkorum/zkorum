<template>
  <div>
    <NewPostButtonWrapper @on-click="createNewPost()">
      <div class="container">
        <CompactPostList :post-list="postList" />
      </div>
    </NewPostButtonWrapper>
  </div>
</template>

<script setup lang="ts">
import CompactPostList from "src/components/feed/CompactPostList.vue";
import NewPostButtonWrapper from "src/components/post/NewPostButtonWrapper.vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { DummyPostDataFormat } from "src/stores/post";
import { useBackendPostApi } from "src/utils/api/post";
import { useDialog } from "src/utils/ui/dialog";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const dialog = useDialog();

const authenticationStore = useAuthenticationStore();

const postStore = useBackendPostApi();

const postList = ref<DummyPostDataFormat[]>([]);

onMounted(async () => {
  postList.value = await postStore.fetchRecentPost();
});

function createNewPost() {
  if (authenticationStore.isAuthenticated) {
    router.push({ name: "create-post" });
  } else {
    dialog.showLoginConfirmationDialog();
  }
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
