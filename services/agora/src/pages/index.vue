<template>
  <div>
    <NewPostButtonWrapper @on-click="createNewPost()">
      <div class="container">
        <CompactPostList :post-list="postList" :data-ready="dataReady" />
      </div>
    </NewPostButtonWrapper>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import CompactPostList from "src/components/feed/CompactPostList.vue";
import NewPostButtonWrapper from "src/components/post/NewPostButtonWrapper.vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import { useBackendPostApi } from "src/utils/api/post";
import { useLastNavigatedRouteName } from "src/utils/nav/lastNavigatedRouteName";
import { useDialog } from "src/utils/ui/dialog";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const dialog = useDialog();

const authenticationStore = useAuthenticationStore();

const postStore = useBackendPostApi();

const dataReady = ref(false);

const { lastSavedHomeFeedPosition } = storeToRefs(usePostStore());
const { lastNavigatedRouteName } = useLastNavigatedRouteName();

const postList = ref<DummyPostDataFormat[]>([]);

onMounted(async () => {
  postList.value = await postStore.fetchRecentPost();
  dataReady.value = true;

  if (lastNavigatedRouteName.value == "single-post") {
    setTimeout(function () {
      window.scrollTo(0, lastSavedHomeFeedPosition.value);
    }, 200);
  }
});

onBeforeUnmount(() => {
  lastSavedHomeFeedPosition.value = -document.body.getBoundingClientRect().top;
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
