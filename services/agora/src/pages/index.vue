<template>
  <div>
    <NewPostButtonWrapper @on-click="createNewPost()">
      <div class="container">
        <CompactPostList v-if="!showfetchErrorMessage" :post-list="postList" :data-ready="dataReady" />

        <div v-if="showfetchErrorMessage" class="fetchErrorMessage">
          <div>
            Failed to fetch posts from the server
          </div>

          <ZKButton label="Reload Page" color="primary" @click="loadData()" />

        </div>
      </div>
    </NewPostButtonWrapper>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import CompactPostList from "src/components/feed/CompactPostList.vue";
import NewPostButtonWrapper from "src/components/post/NewPostButtonWrapper.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
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

const showfetchErrorMessage = ref(false);

onMounted(async () => {
  await loadData();
});

onBeforeUnmount(() => {
  lastSavedHomeFeedPosition.value = -document.body.getBoundingClientRect().top;
});

async function loadData() {
  const response = await postStore.fetchRecentPost();

  dataReady.value = false;

  if (response != null) {
    showfetchErrorMessage.value = false;
    postList.value = response;
    dataReady.value = true;

    if (lastNavigatedRouteName.value == "single-post") {
      setTimeout(function () {
        window.scrollTo(0, lastSavedHomeFeedPosition.value);
      }, 200);
    }
  } else {
    showfetchErrorMessage.value = true;
  }
}

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

.fetchErrorMessage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 4rem;
  font-size: 1.2rem;
}
</style>
