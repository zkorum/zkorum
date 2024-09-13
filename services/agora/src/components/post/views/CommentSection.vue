<template>
  <div>
    <div class="container">

      <ZKCard padding="0.5rem">
        <div class="optionBar">

          <ZKButton @click="clickedCommentSortButton()">
            <div class="sortingOption">
              <q-icon name="mdi-sort" size="1.5rem" />
              <div class="sortLabelStyle">
                {{ commentSortLabel }}
              </div>
            </div>
          </ZKButton>

        </div>
      </ZKCard>

      <div v-for="(commentItem, index) in commentList" v-bind:key="index">
        <ZKCard padding="0rem">
          <div class="contentLayout">
            <div class="metadata">
              <CommunityIcon :image-path="getCommunityImageFromId(commentItem.userCommunityId)" size="2.5rem" />

              {{ getTimeFromNow(commentItem.createdAt) }}
            </div>

            <div>
              <span v-html="commentItem.comment"></span>

              <div class="actionButtonCluster">
                <ZKButton flat text-color="color-text-weak" icon="mdi-dots-horizontal" size="0.8rem" />

                <ZKButton flat text-color="color-text-weak" :icon="getButtonIcon(commentItem.index, true)" size="0.8rem"
                  @click="toggleVote(commentItem.index, 'like')" />
                <div v-if="getCommentItemRankStatus(commentItem.index) != null">
                  {{ commentItem.numUpvotes - commentItem.numDownvotes }}
                </div>
                <div v-if="getCommentItemRankStatus(commentItem.index) == null">
                  Vote
                </div>
                <ZKButton flat text-color="color-text-weak" :icon="getButtonIcon(commentItem.index, false)"
                  size="0.8rem" @click="toggleVote(commentItem.index, 'dislike')" />
              </div>
            </div>

          </div>
        </ZKCard>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyCommentRankingFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import CommunityIcon from "src/components/community/CommunityIcon.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { getTimeFromNow } from "src/utils/common";
import { useBottomSheet } from "src/utils/ui/bottomSheet";
import { useStorage } from "@vueuse/core";
import { useCommentOptions } from "src/utils/component/comments";
import { onMounted, ref, watch } from "vue";

const bottomSheet = useBottomSheet();

const props = defineProps<{
  postSlugId: string,
  commentList: DummyCommentFormat[],
  commentRanking: DummyCommentRankingFormat
}>()

const commentSortPreference = useStorage("comment-sort-preference-id", "new");

const { mapCommentSortOption } = useCommentOptions();

const { updateCommentRanking, getCommunityImageFromId } = usePostStore();

const commentSortLabel = ref("");

onMounted(() => {
  updateSortLabel();
})

watch(commentSortPreference, () => {
  updateSortLabel();
})

function updateSortLabel() {
  commentSortLabel.value = mapCommentSortOption(commentSortPreference.value);
}

function clickedCommentSortButton() {
  bottomSheet.showCommentSortSelector(commentSortPreference);
}

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

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contentLayout {
  display: flex;
  flex-direction: column;
  justify-content: left;
  gap: 1rem;
  padding-top: 0.8rem;
  padding-left: 0.8rem;
  padding-right: 0.8rem;
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

.metadata {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: #737373;
  font-size: 0.8rem;
}

.optionBar {
  display: flex;
  align-items: center;
  justify-content: left;
}

.sortingOption {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sortLabelStyle {
  font-size: 0.8rem;
}
</style>