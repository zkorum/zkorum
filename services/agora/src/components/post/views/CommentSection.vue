<template>
  <div>
    <div class="container">

        <div class="optionBar">
          <q-btn-toggle v-model="commentSortPreference" no-caps rounded unelevated toggle-color="color-text-weak"
            color="button-background-color" text-color="color-text-weak" :options="getCommentSortOptions()">

            <template #one>
              <CommentSortItem :sort-item="getSortItem('popular')" />
            </template>

            <template #two>
              <CommentSortItem :sort-item="getSortItem('controversial')" />
            </template>

            <template #three>
              <CommentSortItem :sort-item="getSortItem('new')" />
            </template>

            <template #four>
              <CommentSortItem :sort-item="getSortItem('surprising')" />
            </template>

          </q-btn-toggle>

          <div class="descriptionLabel">
            {{ description }}
          </div>

        </div>


      <div v-for="(commentItem, index) in commentList" :key="index">
        <CommentSingle :comment-item="commentItem" :post-slug-id="postSlugId" :comment-ranking="commentRanking" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyCommentRankingFormat } from "src/stores/post";
import { useStorage } from "@vueuse/core";
import { CommentSortingItemInterface, useCommentOptions } from "src/utils/component/comments";
import CommentSingle from "./CommentSingle.vue";
import CommentSortItem from "./CommentSortItem.vue";
import { onMounted, ref, watch } from "vue";

defineProps<{
  commentList: DummyCommentFormat[],
  postSlugId: string,
  commentRanking: DummyCommentRankingFormat
}>();

const { getCommentSortOptions } = useCommentOptions();

const commentSortPreference = useStorage("comment-sort-preference-id", "popular");

const description = ref("");

onMounted(() => {
  updateDescription(commentSortPreference.value);
});

watch(commentSortPreference, () => {
  updateDescription(commentSortPreference.value);
});

function updateDescription(sortId: string) {
  const sortItem = getSortItem(sortId);
  description.value = sortItem.description;
}

function getSortItem(sortId: string): CommentSortingItemInterface {
  const sortOptionList = getCommentSortOptions();
  for (let i = 0; i < sortOptionList.length; i++) {
    const sortItem = sortOptionList[i];
    if (sortItem.value == sortId) {
      return sortItem;
    }
  }

  return {
    label2: "",
    icon2: "",
    value: "",
    description: "",
    slot: ""
  };
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.optionBar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.descriptionLabel {
  color: $color-text-weak;
}

</style>
