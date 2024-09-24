<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <ZKCard padding="0rem">
      <div class="contentLayout">
        <div class="metadata">
          {{ getTimeFromNow(commentItem.createdAt) }}
        </div>

        <div>
          <span v-html="commentItem.comment"></span>

          <div class="actionButtonCluster">
            <ZKButton flat text-color="color-text-weak" icon="mdi-dots-horizontal" size="0.8rem"
              @click="optionButtonClicked()" />

            <ZKButton flat text-color="color-text-weak" :icon="getButtonIcon(commentItem.index, false)" size="0.8rem"
              @click="toggleVote(commentItem.index, 'dislike')">
              <div v-if="getCommentItemRankStatus(commentItem.index) != null" class="voteCountLabel">
                {{ commentItem.numDownvotes }}
              </div>
            </ZKButton>

            <ZKButton flat text-color="color-text-weak" :icon="getButtonIcon(commentItem.index, true)" size="0.8rem"
              @click="toggleVote(commentItem.index, 'like')">
              <div v-if="getCommentItemRankStatus(commentItem.index) != null" class="voteCountLabel">
                {{ commentItem.numUpvotes }}
              </div>
            </ZKButton>
          </div>
        </div>

      </div>
    </ZKCard>

  </div>
</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { DummyCommentFormat, DummyCommentRankingFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import { getTimeFromNow } from "src/utils/common";
import { useBottomSheet } from "src/utils/ui/bottomSheet";

const props = defineProps<{
  commentItem: DummyCommentFormat,
  postSlugId: string,
  commentRanking: DummyCommentRankingFormat
}>();

const { updateCommentRanking } = usePostStore();

const bottomSheet = useBottomSheet();

function optionButtonClicked() {
  bottomSheet.showCommentOptionSelector();
}

function getCommentItemRankStatus(commentIndex: number) {
  const action = props.commentRanking.rankedCommentList.get(commentIndex);
  return action;
}

function getButtonIcon(commentIndex: number, isUpvoteButton: boolean): string {
  const commentAction = getCommentItemRankStatus(commentIndex);
  if (isUpvoteButton) {
    if (commentAction == "like") {
      return "mdi-thumb-up";
    } else {
      return "mdi-thumb-up-outline";
    }
  } else {
    if (commentAction == "dislike") {
      return "mdi-thumb-down";
    } else {
      return "mdi-thumb-down-outline";
    }
  }
}

function toggleVote(commentIndex: number, isUpvoteButton: PossibleCommentRankingActions) {
  updateCommentRanking(props.postSlugId, commentIndex, isUpvoteButton);
}

</script>

<style scoped lang="scss">
.contentLayout {
  display: flex;
  flex-direction: column;
  justify-content: left;
  gap: 1rem;
  padding-top: 0.8rem;
  padding-left: 0.8rem;
  padding-right: 0.8rem;
}

.metadata {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;
  color: $color-text-weak;
}

.voteCountLabel {
  padding-left: 0.5rem;
}

.actionButtonCluster {
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  color: $color-text-weak;
}

</style>

