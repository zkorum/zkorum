<template>
  <div>
    <PostDetails v-if="dataLoaded" :extended-post-data="postData" :compact-mode="false" :skeleton-mode="false" />
  </div>
</template>

<script setup lang="ts">
import PostDetails from "src/components/post/PostDetails.vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import { useBackendPostApi } from "src/utils/api/post";
import { onMounted, ref } from "vue";

const props = defineProps<{
  postSlugId: string;
}>();

const { fetchPostBySlugId } = useBackendPostApi();
const { isAuthenticated } = useAuthenticationStore();
const { emptyPost } = usePostStore();
const postData = ref<DummyPostDataFormat>(emptyPost);

const dataLoaded = ref(false);

onMounted(async () => {
  const response = await fetchPostBySlugId(props.postSlugId, isAuthenticated);
  if (response != null) {
    postData.value = response;
  }
  dataLoaded.value = true;
});
</script>

<style scoped lang="scss"></style>
