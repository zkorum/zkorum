<template>
  <div>
    <div class="actionButtonCluster">
      <ZKButton flat text-color="color-text-weak" icon="mdi-dots-horizontal" size="0.8rem"
        @click.stop.prevent="optionButtonClicked()" />

      <ZKButton flat text-color="color-text-weak" icon="mdi-export-variant" size="0.8rem"
        @click.stop.prevent="shareButtonClicked()" />
      <ZKButton flat text-color="color-text-weak" :icon="getButtonIcon(false)" size="0.8rem"
        @click.stop.prevent="toggleVote(commentItem.index, 'dislike')">
        <div v-if="isRanked" class="voteCountLabel">
          {{ commentItem.numDownvotes }}
        </div>
      </ZKButton>

      <ZKButton flat text-color="color-text-weak" :icon="getButtonIcon(true)" size="0.8rem"
        @click.stop.prevent="toggleVote(commentItem.index, 'like')">
        <div v-if="isRanked" class="voteCountLabel">
          {{ commentItem.numUpvotes }}
        </div>
      </ZKButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import { useBottomSheet } from "src/utils/ui/bottomSheet";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useWebShare } from "src/utils/share/WebShare";

const props = defineProps<{
  commentItem: DummyCommentFormat,
  postSlugId: string,
  isRanked: boolean,
  rankedAction: PossibleCommentRankingActions
}>();

const { updateCommentRanking } = usePostStore();

const bottomSheet = useBottomSheet();

const webShare = useWebShare();

function shareButtonClicked() {
  const sharePostUrl = window.location.origin + "/post/" + props.postSlugId + "?commentSlugId=" + props.commentItem.slugId;
  webShare.share("Agora Comment", sharePostUrl);
}

function optionButtonClicked() {
  bottomSheet.showCommentOptionSelector();
}

function toggleVote(commentIndex: number, isUpvoteButton: PossibleCommentRankingActions) {
  updateCommentRanking(props.postSlugId, commentIndex, isUpvoteButton);
}

function getButtonIcon(isUpvoteButton: boolean): string {
  if (props.isRanked && props.rankedAction != "pass") {
    if (isUpvoteButton) {
      if (props.rankedAction == "like") {
        return "mdi-thumb-up";
      } else {
        return "mdi-thumb-up-outline";
      }
    } else {
      if (props.rankedAction == "dislike") {
        return "mdi-thumb-down";
      } else {
        return "mdi-thumb-down-outline";
      }
    }
  } else {
    if (isUpvoteButton) {
      return "mdi-thumb-up-outline";
    } else {
      return "mdi-thumb-down-outline";
    }
  }
}
</script>

<style scoped lang="scss">
.actionButtonCluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: right;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: $color-text-weak;
}

.voteCountLabel {
  padding-left: 0.5rem;
}
</style>
