<template>
  <div>
    <div class="container">

      <ZKCard padding="0.5rem">
        <div class="optionBar" @click="clickedCommentSortButton()">

          <div class="sortingOption">
            <q-icon name="mdi-sort" size="1.5rem" color="color-text-weak" />
            <div class="sortLabelStyle">
              {{ commentSortLabel }}
            </div>
          </div>

        </div>
      </ZKCard>

      <div v-for="(commentItem, index) in commentList" :key="index">
        <CommentSingle :comment-item="commentItem" :post-slug-id="postSlugId" :comment-ranking="commentRanking" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyCommentRankingFormat } from "src/stores/post";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { useBottomSheet } from "src/utils/ui/bottomSheet";
import { useStorage } from "@vueuse/core";
import { useCommentOptions } from "src/utils/component/comments";
import { onMounted, ref, watch } from "vue";
import CommentSingle from "./CommentSingle.vue";

const bottomSheet = useBottomSheet();

defineProps<{
  commentList: DummyCommentFormat[],
  postSlugId: string,
  commentRanking: DummyCommentRankingFormat
}>();

const commentSortPreference = useStorage("comment-sort-preference-id", "new");

const { mapCommentSortOption } = useCommentOptions();

const commentSortLabel = ref("");

onMounted(() => {
  updateSortLabel();
});

watch(commentSortPreference, () => {
  updateSortLabel();
});

function updateSortLabel() {
  commentSortLabel.value = mapCommentSortOption(commentSortPreference.value);
}

function clickedCommentSortButton() {
  bottomSheet.showCommentSortSelector(commentSortPreference);
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
  align-items: center;
  justify-content: left;
  padding-left: 0.2rem;
}

.optionBar:hover {
  cursor: pointer;
}

.sortingOption {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sortLabelStyle {
  font-size: 0.8rem;
  font-weight: 500;
  color: $color-text-weak;
}

</style>
