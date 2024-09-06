<template>
  <div>
    <div class="container">

      <div class="contentLayout">
        <div class="postTitle">
          {{ postItem.payload.title }}
        </div>

        <div class="postBody">
          {{ postItem.payload.body }}
        </div>

        <ZKCard v-if="finishedRanking">
          <div class="finishedMessage">

            <div class="finishedIcon">
              <q-icon name="mdi-check" size="3rem" />
            </div>

            <div>
              All comments have been ranked!
            </div>

            <RouterLink
              :to="{ name: 'single-post', params: { communityId: postItem.metadata.communityId, postSlugId: postItem.metadata.slugId } }">
              <ZKButton outline text-color-flex="secondary" label="Open Post" icon="mdi-arrow-right-box" />
            </RouterLink>

          </div>
        </ZKCard>

        <ZKCard v-if="!finishedRanking">
          <div class="progressBar">
            <q-linear-progress color="primary" track-color="secondary" :value="progress">
            </q-linear-progress>
          </div>

          <div class="lowOpacity">
            Vote on other people's statements
          </div>

          <swiper-container slides-per-view="1" initialSlide="1">
            <swiper-slide>
              <div class="sidePage">
                <q-icon name="mdi-chevron-double-down" flat color="secondary" size="3rem" />
                <div>
                  Downvoted
                </div>
              </div>
            </swiper-slide>

            <swiper-slide>

              <div class="rankingDiv">
                <div class="userComment">
                  <div>
                    {{ displayCommentItem.comment }}
                  </div>
                </div>

                <div class="rankingButtonCluster">
                  <ZKButton flat text-color-flex="secondary" icon="mdi-thumb-down" size="1.3rem"
                    @click="rankComment('dislike', false)" />
                  <ZKButton flat text-color-flex="secondary" label="Pass" @click="rankComment('pass', false)" />
                  <ZKButton flat text-color-flex="secondary" icon="mdi-thumb-up" size="1.3rem"
                    @click="rankComment('like', false)" />
                </div>
              </div>
            </swiper-slide>

            <swiper-slide>
              <div class="sidePage">
                <q-icon name="mdi-chevron-double-up" flat color="secondary" size="3rem" />
                <div>
                  Upvoted
                </div>
              </div>
            </swiper-slide>
          </swiper-container>

          <div class="currentIndexText lowOpacity">
            Ranked {{ currentRankIndex }} of {{ unrankedCommentList.length }}
          </div>

        </ZKCard>

      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import { DummyCommentFormat, PossibleCommentRankingActions, usePostStore } from "src/stores/post";
import ZKButton from "../ui-library/ZKButton.vue";
import ZKCard from "../ui-library/ZKCard.vue";
import { onMounted, ref } from "vue";
import { SwiperContainer } from "swiper/element";

const props = defineProps<{
  postSlugId: string
}>()

const { getUnrankedComments, getPostBySlugId, updateCommentRanking } = usePostStore();

const postItem = getPostBySlugId(props.postSlugId);
const unrankedCommentList = getUnrankedComments(props.postSlugId)

let currentRankIndex = ref(0);

const finishedRanking = ref(false);
checkFinishedRanking();

let displayCommentItem: DummyCommentFormat = {
  index: 0,
  userCommunityId: "",
  userCommunityImage: "",
  createdAt: new Date(),
  comment: "",
  numUpvotes: 0,
  numDownvotes: 0
}

const progress = ref(0);

loadNextComment(currentRankIndex.value);

let swiperEl: SwiperContainer | null = null;

onMounted(() => {

  swiperEl = document.querySelector("swiper-container");
  if (swiperEl != null) {
    swiperEl.addEventListener("swiperslidechange", () => {
      if (swiperEl?.swiper.activeIndex == 2) {
        rankComment("like", true);
      } else if (swiperEl?.swiper.activeIndex == 0) {
        rankComment("dislike", true);
      } else {
        return;
      }
    });
  }
})

function checkFinishedRanking() {
  if (unrankedCommentList.length == currentRankIndex.value) {
    finishedRanking.value = true;
    return true;
  } else {
    return false;
  }
}

function loadNextComment(index: number) {
  displayCommentItem = unrankedCommentList[index];
}

function updateProgressBar() {
  progress.value = currentRankIndex.value / unrankedCommentList.length;
}

function rankComment(commentAction: PossibleCommentRankingActions, isSwiper: boolean) {
  currentRankIndex.value += 1;
  updateProgressBar();

  updateCommentRanking(props.postSlugId, displayCommentItem.index, commentAction);

  if (isSwiper) {
    setTimeout(
      function () {
        const isDone = checkFinishedRanking();
        if (!isDone) {
          loadNextComment(currentRankIndex.value);
          swiperEl?.swiper.slideTo(1, 500);
        }
      }, 500);
  } else {
    const isDone = checkFinishedRanking();
    if (!isDone) {
      loadNextComment(currentRankIndex.value);
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
  justify-content: space-between
}

.contentLayout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.userComment {
  text-align: center;
  font-size: 1.2rem;
}

.postTitle {
  font-weight: bold;
  font-size: 1.3rem;
  padding-top: 2rem;
}

.postBody {
  font-size: 1rem;
}

.rankingDiv {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding-top: 2rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 2rem;
}

.progressBar {
  padding-bottom: 0.4rem;
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

.currentIndexText {
  text-align: left;
  font-size: 0.8rem;
}

.lowOpacity {
  opacity: 0.6;
}

.sidePage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding-top: 3rem;
  color: $secondary;
}
</style>