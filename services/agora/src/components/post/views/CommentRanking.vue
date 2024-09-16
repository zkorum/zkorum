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

            <div class="weakColor" :style="{ paddingBottom: '2rem' }">
              Vote on other people's statements ({{ currentRankIndex }} of {{ unrankedCommentList.length }})
            </div>

            <div>
              <swiper-container ref="el" slides-per-view="1" initial-slide="1">
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
                    <div class="userComment">
                      “
                      <span v-html="displayCommentItem.comment"></span>
                      ”
                    </div>

                    <div class="rankingButtonCluster">
                      <ZKButton flat text-color="secondary" icon="mdi-thumb-down" size="1.3rem"
                        @click="rankComment('dislike', false)" />
                      <ZKButton flat text-color="secondary" label="Pass" size="1rem"
                        @click="rankComment('pass', false)" />
                      <ZKButton flat text-color="secondary" icon="mdi-thumb-up" size="1.3rem"
                        @click="rankComment('like', false)" />
                    </div>

                    <div class="reportButton">
                      <ZKButton outline text-color="secondary" label="Report" icon="mdi-alert-outline" size="0.8rem"
                        @click="reportButtonClicked()" />
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
                <ZKButton outline text-color="secondary" label="Rank More" icon="mdi-vote"
                  @click="clickedRankMoreButton()" />

                <ZKButton outline text-color="secondary" label="See Results" icon="mdi-chart-bar"
                  @click="clickedSeeResultsButton()" />
              </div>
            </div>
          </div>

        </ZKCard>

      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import { DummyCommentFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { onMounted, ref, watch } from "vue";
import { SwiperContainer } from "swiper/element";
import { useElementSize } from "@vueuse/core";
import { useBottomSheet } from "src/utils/ui/bottomSheet";

const props = defineProps<{
  postSlugId: string
}>();

const emit = defineEmits(["clickedCommentButton"]);

const { getUnrankedComments, updateCommentRanking, getPostBySlugId } = usePostStore();

const { showCommentRankingReportSelector } = useBottomSheet();

const cardElement = ref();

const el = ref(null);
const elementSize = useElementSize(el);

const unrankedCommentList = getUnrankedComments(props.postSlugId);

const postItem = getPostBySlugId(props.postSlugId);

let currentRankIndex = ref(0);

const finishedRanking = ref(false);
checkFinishedRanking();

let displayCommentItem = ref<DummyCommentFormat>({
  index: 0,
  userCommunityId: "",
  userCommunityImage: "",
  createdAt: new Date(),
  comment: "",
  numUpvotes: 0,
  numDownvotes: 0
});

const progress = ref(0);

const topPadding = ref(0);

loadNextComment();

let swiperEl: SwiperContainer | null = null;

const selectedCommentReportId = ref("");

onMounted(() => {

  updatePaddingSize();

  swiperEl = document.querySelector("swiper-container");
  if (swiperEl != null) {
    swiperEl.addEventListener("swiperslidechange", () => {
      if (swiperEl?.swiper.activeIndex == 2) {
        rankComment("dislike", true);
      } else if (swiperEl?.swiper.activeIndex == 0) {
        rankComment("like", true);
      } else {
        return;
      }
    });
  }
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

function clickedCommentButton() {
  emit("clickedCommentButton");
}

function reportButtonClicked() {
  showCommentRankingReportSelector(selectedCommentReportId);
}

function clickedRankMoreButton() {
}

function clickedSeeResultsButton() {
}

function updatePaddingSize() {
  const newPadding = elementSize.height.value / 2 - 60;
  topPadding.value = newPadding;
}

function checkFinishedRanking() {
  if (unrankedCommentList.length == currentRankIndex.value) {
    finishedRanking.value = true;
    return true;
  } else {
    return false;
  }
}

function loadNextComment() {
  displayCommentItem.value = unrankedCommentList[currentRankIndex.value];
}

function updateProgressBar() {
  progress.value = currentRankIndex.value / unrankedCommentList.length;
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
        swiperEl?.swiper.slideTo(1, 500);
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
  gap: 2rem;
}
</style>
