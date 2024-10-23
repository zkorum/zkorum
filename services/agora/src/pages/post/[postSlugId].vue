<template>
  <div>
    <PostDetails :extended-post-data="postData" :compact-mode="false"/>
  </div>
</template>

<script setup lang="ts">
import PostDetails from "src/components/post/PostDetails.vue";
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import { useBackendPostApi } from "src/utils/api/post";
import { onMounted, ref } from "vue";

const props = defineProps<{
  postSlugId: string
}>();

const { fetchPostBySlugId } = useBackendPostApi();
const { emptyPost } = usePostStore();
const postData = ref<DummyPostDataFormat>(emptyPost);

onMounted(async () => {
  postData.value = await fetchPostBySlugId(props.postSlugId);
});

</script>

<style scoped lang="scss">
</style>
