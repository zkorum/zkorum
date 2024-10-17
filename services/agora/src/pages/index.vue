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
import NewPostButtonWrapper from "src/components/post/NewPostButtonWrapper.vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { useBackendPostApi } from "src/utils/api/post";
import { useDialog } from "src/utils/ui/dialog";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const dialog = useDialog();

const authenticationStore = useAuthenticationStore();

const backendPostApi = useBackendPostApi();

onMounted(() => {
  setTimeout(
    function () {
      backendPostApi.createNewPost();
    }, 1000);
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
