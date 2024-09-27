<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div class="container">
      <div>
        <ZKCard padding="1rem">
          <div v-if="!finishedRanking" ref="cardElement">
            <div class="progressBar">
              <q-linear-progress color="primary" track-color="secondary" :value="progress" />
            </div>

            <div class="weakColor unselectable" :style="{ paddingBottom: '2rem' }">
              Vote on other people's statements ({{ currentRankIndex }} of {{ unrankedCommentList.length }})
            </div>

            <div>
              <swiper-container ref="swipingElementRef" slides-per-view="1" initial-slide="1">
                <swiper-slide>
                  <div class="sidePage" :style="{ paddingTop: topPadding + 'px' }">
                    <q-icon name="mdi-chevron-double-up" flat color="secondary" size="3rem" />
                    <div>
                      Upvoted
                    </div>
                  </div>
                </swiper-slide>

                <swiper-slide>

                  <div class="rankingDiv">
                    <div class="userComment unselectable">
                      “
                      <span v-html="displayCommentItem.comment"></span>
                      ”
                    </div>

                    <div class="rankingButtonCluster">
                      <ZKButton flat text-color="color-text-strong" icon="mdi-thumb-down-outline" size="1.3rem"
                        @click="rankComment('dislike', false)" />
                      <ZKButton flat text-color="color-text-strong" label="Pass" size="1rem"
                        @click="rankComment('pass', false)" />
                      <ZKButton flat text-color="color-text-strong" icon="mdi-thumb-up-outline" size="1.3rem"
                        @click="rankComment('like', false)" />
                    </div>

                    <div class="reportButton">
                      <ZKButton outline text-color="color-text-strong" label="Report" icon="mdi-alert-outline"
                        size="0.8rem" @click="reportButtonClicked()" />
                    </div>
                  </div>
                </swiper-slide>

                <swiper-slide>
                  <div class="sidePage" :style="{ paddingTop: topPadding + 'px' }">
                    <q-icon name="mdi-chevron-double-down" flat color="secondary" size="3rem" />
                    <div>
                      Downvoted
                    </div>
                  </div>
                </swiper-slide>
              </swiper-container>
            </div>
          </div>

          <div v-if="finishedRanking">

            <div v-if="postItem.payload.comments.length == 0" class="finishedMessage">
              <div class="finishedIcon">
                <q-icon name="mdi-vote" size="3rem" />
              </div>

              <div>
                There are no comments available to rank yet!
              </div>

              <div>
                <ZKButton outline text-color="primary" icon="comment" size="1rem" label="Add a comment"
                  @click="clickedCommentButton()" />
              </div>
            </div>

            <div v-if="postItem.userInteraction.commentRanking.assignedRankingItems.length > 0" class="finishedMessage">
              <div class="finishedIcon">
                <q-icon name="mdi-check" size="3rem" />
              </div>

              <div>
                You have ranked {{ postItem.userInteraction.commentRanking.rankedCommentList.size }}
                comment<span v-if="postItem.userInteraction.commentRanking.rankedCommentList.size > 1">s</span>!
              </div>

              <div class="finishedActionButtons">
                <ZKButton v-if="postItem.payload.comments.length != postItem.userInteraction.commentRanking.rankedCommentList.size"
                  outline text-color="color-text-strong" @click="clickedRankMoreButton()">
                  <div class="iconStyle">
                    <q-icon name="mdi-vote" color="color-text-strong" />
                    <div>
                      Vote More
                    </div>
                  </div>
                </ZKButton>

                <ZKButton outline text-color="color-text-strong" @click="clickedSeeResultsButton()">
                  <div class="iconStyle">
                    <q-icon name="mdi-chart-bar" color="color-text-strong" />
                    <div>
                      See Results
                    </div>
                  </div>

                </ZKButton>
              </div>
            </div>
          </div>

        </ZKCard>

      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import { DummyCommentFormat, DummyPostDataFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { SwiperContainer } from "swiper/element";
import { useElementSize } from "@vueuse/core";
import { useBottomSheet } from "src/utils/ui/bottomSheet";

const props = defineProps<{
  postSlugId: string
}>();

const emit = defineEmits(["clickedCommentButton", "clickedSeeResultButton"]);

const { updateCommentRanking, getPostBySlugId, allocateAllCommentsForRanking, emptyPost } = usePostStore();

const { showCommentRankingReportSelector } = useBottomSheet();

const cardElement = ref();

const swipingElementRef = ref<SwiperContainer| null>(null);
const elementSize = useElementSize(swipingElementRef);

const unrankedCommentList = ref<DummyCommentFormat[]>([]);

const postItem = ref<DummyPostDataFormat>(emptyPost);

let currentRankIndex = ref(0);

const finishedRanking = ref(false);

const emptyCommentItem: DummyCommentFormat = {
  index: 0,
  userCommunityId: "",
  userCommunityImage: "",
  createdAt: new Date(),
  comment: "",
  numUpvotes: 0,
  numDownvotes: 0,
  slugId: ""
};

let displayCommentItem = ref<DummyCommentFormat>(emptyCommentItem);

const progress = ref(0);
const topPadding = ref(0);

const selectedCommentReportId = ref("");

const swiperChangeFunction = () => {
  if (swipingElementRef.value?.swiper.activeIndex == 2) {
    rankComment("dislike", true);
  } else if (swipingElementRef.value?.swiper.activeIndex == 0) {
    rankComment("like", true);
  } else {
    return;
  }
};

onMounted(() => {
  initializeData();

  updatePaddingSize();
});

onUnmounted(() => {
  unmountSwiper();
});

watch(elementSize.height, () => {
  updatePaddingSize();
});

watch(selectedCommentReportId, () => {
  // Send report
  if (selectedCommentReportId.value != "") {
    rankComment("pass", false);
    selectedCommentReportId.value = "";
  }
});

function unmountSwiper() {
  swipingElementRef.value?.removeEventListener("swiperslidechange", swiperChangeFunction);
}

function mountSwiper() {
  if (swipingElementRef.value != null) {
    swipingElementRef.value.addEventListener("swiperslidechange", swiperChangeFunction);
  } else {
    console.log("Failed to mount swiper");
  }
}

function getUnrankedComments(): DummyCommentFormat[] {
  const assignedRankingItems = postItem.value.userInteraction.commentRanking.assignedRankingItems;
  const rankedCommentList = postItem.value.userInteraction.commentRanking.rankedCommentList;

  const unrankedCommentIndexes: number[] = [];

  for (let i = 0; i < assignedRankingItems.length; i++) {
    const assignedIndex = assignedRankingItems[i];
    let isRanked = false;
    for (const [key] of rankedCommentList.entries()) {
      if (assignedIndex == key) {
        isRanked = true;
      }
    }
    if (!isRanked) {
      unrankedCommentIndexes.push(assignedIndex);
    }
  }

  const unrankedComments: DummyCommentFormat[] = [];
  for (let unrankedIndex = 0; unrankedIndex < unrankedCommentIndexes.length; unrankedIndex++) {
    for (let commentIndex = 0; commentIndex < postItem.value.payload.comments.length; commentIndex++) {
      const commentItem = postItem.value.payload.comments[commentIndex];
      if (unrankedCommentIndexes[unrankedIndex] == commentItem.index) {
        unrankedComments.push(commentItem);
        break;
      }
    }
  }

  return unrankedComments;
}

function initializeData() {

  mountSwiper();

  postItem.value = getPostBySlugId(props.postSlugId);
  currentRankIndex.value = 0;
  unrankedCommentList.value = getUnrankedComments();
  // finishedRanking.value = false;

  if (unrankedCommentList.value.length > 0) {
    loadNextComment();
  }

  checkFinishedRanking();
}

function clickedCommentButton() {
  emit("clickedCommentButton");
}

function reportButtonClicked() {
  showCommentRankingReportSelector(selectedCommentReportId);
}

async function clickedRankMoreButton() {
  finishedRanking.value = false;
  allocateAllCommentsForRanking(props.postSlugId);
  await nextTick();
  initializeData();
}

function clickedSeeResultsButton() {
  emit("clickedSeeResultButton");
}

function updatePaddingSize() {
  const newPadding = elementSize.height.value / 2 - 60;
  topPadding.value = newPadding;
}

function checkFinishedRanking() {
  if (unrankedCommentList.value.length == currentRankIndex.value) {
    finishedRanking.value = true;
    unmountSwiper();
    return true;
  } else {
    return false;
  }
}

function loadNextComment() {
  displayCommentItem.value = unrankedCommentList.value[currentRankIndex.value];
}

function updateProgressBar() {
  progress.value = currentRankIndex.value / unrankedCommentList.value.length;
}

function rankComment(commentAction: PossibleCommentRankingActions, isSwiper: boolean) {
  currentRankIndex.value += 1;
  updateProgressBar();

  updateCommentRanking(props.postSlugId, displayCommentItem.value.index, commentAction);

  if (isSwiper) {
    setTimeout(() => {
      const isDone = checkFinishedRanking();
      if (!isDone) {
        loadNextComment();
        swipingElementRef.value?.swiper.slideTo(1, 500);
      }
    }, 500);
  } else {
    const isDone = checkFinishedRanking();
    if (!isDone) {
      loadNextComment();
    }
  }
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 1rem;
}

.rankingButtonCluster {
  display: flex;
  justify-content: space-between;
}

.userComment {
  text-align: left;
  font-size: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  line-height: 1.8;
  min-height: 8rem;
}

.rankingDiv {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.progressBar {
  padding-bottom: 1rem;
}

.finishedMessage {
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
}

.seePostButton {
  display: flex;
  justify-content: right;
  width: 100%;
}

.finishedIcon {
  border-radius: 50%;
  border-style: solid;
  border-width: 2px;
  padding: 0.5rem;
}

.weakColor {
  color: $color-text-weak;
}

.sidePage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  color: $secondary;
}

.reportButton {
  display: flex;
  justify-content: right;
}

.finishedActionButtons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.unselectable {
  user-select: none;
}

.iconStyle {
  display:flex;
  align-items: center;
  justify-items: center;
  gap: 0.5rem;
  padding: 0.2rem;
}

</style>
