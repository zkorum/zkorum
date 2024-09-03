<template>
  <div>
    <div class="container">
      <div v-for="(commentItem, index) in commentList" v-bind:key="index">
        <div>
          <ZKCard>
            <div class="contentLayout">
              <PostMetadata :community-id="commentItem.userCommunityId" :created-at="commentItem.createdAt"
                :isCompatSize="true" />
              <div>{{ commentItem.comment }}</div>

              <div class="actionButtonCluster">
                <ZKButton flat text-color-flex="black" icon="mdi-dots-horizontal" size="0.8rem" />

                <ZKButton flat text-color-flex="black" :icon="getButtonIcon(commentItem.index, true)" size="0.8rem" />
                <div v-if="getCommentItemRankStatus(commentItem.index).action != 'pass'">
                  {{ commentItem.numUpvotes - commentItem.numDownvotes }}
                </div>
                <ZKButton flat text-color-flex="black" :icon="getButtonIcon(commentItem.index, false)" size="0.8rem" />
              </div>

            </div>
          </ZKCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyCommentRankingFormat, UserRankedCommentItem } from "@/stores/post";
import ZKCard from "../ui-library/ZKCard.vue";
import ZKButton from "../ui-library/ZKButton.vue";
import PostMetadata from "./PostMetadata.vue";

const props = defineProps<{
  commentList: DummyCommentFormat[],
  commentRanking: DummyCommentRankingFormat
}>()

function getCommentItemRankStatus(commentIndex: number): UserRankedCommentItem {
  for (let i = 0; i < props.commentRanking.rankedCommentList.length; i++) {
    const rankingItem = props.commentRanking.rankedCommentList[i];
    if (rankingItem.index == commentIndex) {
      return rankingItem;
    }
  }

  const emptyItem: UserRankedCommentItem = {
    index: 0,
    action: "pass"
  }
  return emptyItem;
}

function getButtonIcon(commentIndex: number, isUpvoteButton: boolean): string {
  const rankingItem = getCommentItemRankStatus(commentIndex);
  if (isUpvoteButton) {
    if (rankingItem.action == "like") {
      return "mdi-arrow-up-bold";
    } else {
      return "mdi-arrow-up-bold-outline";
    }
  } else {
    if (rankingItem.action == "dislike") {
      return "mdi-arrow-down-bold";
    } else {
      return "mdi-arrow-down-bold-outline";
    }
  }


}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contentLayout {
  display: flex;
  flex-direction: column;
  justify-content: left;
  gap: 0.2rem;
}

.communityIconStyle {
  width: 2rem;
}

.actionButtonCluster {
  display: flex;
  align-items: center;
  justify-content: right;
  font-size: 0.8rem;
  font-weight: bold;
}
</style>