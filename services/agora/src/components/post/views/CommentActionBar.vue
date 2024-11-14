<template>
  <div>
    <div class="actionButtonCluster">
      <ZKButton flat text-color="color-text-weak" icon="mdi-dots-horizontal" size="0.8rem"
        @click.stop.prevent="optionButtonClicked()" />

      <ZKButton flat text-color="color-text-weak" icon="mdi-export-variant" size="0.8rem"
        @click.stop.prevent="shareButtonClicked()" />
      <ZKButton flat :text-color="downvoteIcon.color" :icon="downvoteIcon.icon" size="0.8rem" @click.stop.prevent="
        castPersonalVote(props.commentItem.commentSlugId, false)
        ">
        <div v-if="userCastedVote" class="voteCountLabel">
          {{ commentItem.numDislikes }}
        </div>
      </ZKButton>

      <ZKButton flat :text-color="upvoteIcon.color" :icon="upvoteIcon.icon" size="0.8rem" @click.stop.prevent="
        castPersonalVote(props.commentItem.commentSlugId, true)
        ">
        <div v-if="userCastedVote" class="voteCountLabel">
          {{ commentItem.numLikes }}
        </div>
      </ZKButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PossibleCommentRankingActions } from "src/stores/post";
import { useBottomSheet } from "src/utils/ui/bottomSheet";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useWebShare } from "src/utils/share/WebShare";
import { useBackendVoteApi } from "src/utils/api/vote";
import { computed } from "vue";
import { CommentItem, VotingAction } from "src/shared/types/zod";

const props = defineProps<{
  commentItem: CommentItem;
  postSlugId: string;
  rankedAction: PossibleCommentRankingActions;
  commentSlugIdLikedMap: Map<string, "like" | "dislike">;
}>();

const bottomSheet = useBottomSheet();

const webShare = useWebShare();

const { castVoteForComment } = useBackendVoteApi();

const userCastedVote = computed(() => {
  const hasEntry = props.commentSlugIdLikedMap.has(props.commentItem.commentSlugId);
  return hasEntry ? true : false;
});

interface IconObject {
  icon: string;
  color: string;
}

const downvoteIcon = computed<IconObject>(() => {
  const userAction = props.commentSlugIdLikedMap.get(props.commentItem.commentSlugId);
  if (userAction == "dislike") {
    return {
      icon: "mdi-thumb-down",
      color: "primary"
    };
  } else {
    return {
      icon: "mdi-thumb-down-outline",
      color: "color-text-weak"
    };
  }
});

const upvoteIcon = computed<IconObject>(() => {
  const userAction = props.commentSlugIdLikedMap.get(props.commentItem.commentSlugId);
  if (userAction == "like") {
    return {
      icon: "mdi-thumb-up",
      color: "primary"
    };
  } else {
    return {
      icon: "mdi-thumb-up-outline",
      color: "color-text-weak"
    };
  }
});

function shareButtonClicked() {
  const sharePostUrl =
    window.location.origin +
    "/post/" +
    props.postSlugId +
    "?commentSlugId=" +
    props.commentItem.commentSlugId;
  webShare.share("Agora Comment", sharePostUrl);
}

function optionButtonClicked() {
  bottomSheet.showCommentOptionSelector();
}

async function castPersonalVote(
  commentSlugId: string,
  isUpvoteButton: boolean
) {
  let targetState: VotingAction = "cancel";
  const currentSelection = props.commentSlugIdLikedMap.get(props.commentItem.commentSlugId);
  if (currentSelection == undefined) {
    targetState = isUpvoteButton ? "like" : "dislike";
  } else {
    if (currentSelection == "like") {
      if (isUpvoteButton) {
        targetState = "cancel";
      } else {
        targetState = "dislike";
      }
    } else {
      if (isUpvoteButton) {
        targetState = "like";
      } else {
        targetState = "cancel";
      }
    }
  }

  const response = await castVoteForComment(commentSlugId, targetState);
  console.log(response);
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
