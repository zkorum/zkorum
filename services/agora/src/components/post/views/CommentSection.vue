<template>
  <div>
    <div class="container">
      <div v-for="(commentItem, index) in commentList" v-bind:key="index">
        <div>
          <div class="contentLayout">
            <div class="metadata">
              <CommunityIcon :image-path="getCommunityImageFromId(commentItem.userCommunityId)" size="2.5rem" />

              {{ getTimeFromNow(commentItem.createdAt) }}
            </div>

            <div>
              {{ commentItem.comment }}
              <div class="actionButtonCluster">
                <ZKButton flat text-color-flex="black" icon="mdi-dots-horizontal" size="0.8rem" />

                <ZKButton flat text-color-flex="black" :icon="getButtonIcon(commentItem.index, true)" size="0.8rem"
                  @click="toggleVote(commentItem.index, 'like')" />
                <div v-if="getCommentItemRankStatus(commentItem.index) != undefined">
                  {{ commentItem.numUpvotes - commentItem.numDownvotes }}
                </div>
                <ZKButton flat text-color-flex="black" :icon="getButtonIcon(commentItem.index, false)" size="0.8rem"
                  @click="toggleVote(commentItem.index, 'dislike')" />
              </div>
            </div>

          </div>
        </div>

        <div class="separator">
          <q-separator />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyCommentRankingFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import CommunityIcon from "src/components/community/CommunityIcon.vue";
import { getTimeFromNow } from "src/utils/common";

const props = defineProps<{
  postSlugId: string,
  commentList: DummyCommentFormat[],
  commentRanking: DummyCommentRankingFormat
}>()

const { updateCommentRanking, getCommunityImageFromId } = usePostStore();

function getCommentItemRankStatus(commentIndex: number) {
  const action = props.commentRanking.rankedCommentList.get(commentIndex);
  return action;
}

function getButtonIcon(commentIndex: number, isUpvoteButton: boolean): string {
  const commentAction = getCommentItemRankStatus(commentIndex);
  if (isUpvoteButton) {
    if (commentAction == "like") {
      return "mdi-arrow-up-bold";
    } else {
      return "mdi-arrow-up-bold-outline";
    }
  } else {
    if (commentAction == "dislike") {
      return "mdi-arrow-down-bold";
    } else {
      return "mdi-arrow-down-bold-outline";
    }
  }
}

function toggleVote(commentIndex: number, isUpvoteButton: PossibleCommentRankingActions) {
  updateCommentRanking(props.postSlugId, commentIndex, isUpvoteButton);
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.separator {
  padding-top: 0.5rem;
}

.contentLayout {
  display: flex;
  flex-direction: column;
  justify-content: left;
  gap: 1rem;
}

.actionButtonCluster {
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.metadata {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: #737373;
  font-size: 0.8rem;
}
</style>