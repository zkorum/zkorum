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
              All comments had been ranked!
            </div>

            <RouterLink
              :to="{ name: 'single-post', params: { communityId: postItem.metadata.communityId, postSlugId: postItem.metadata.slugId } }">
              <ZKButton label="Open Post" icon="mdi-arrow-right-box" />
            </RouterLink>

          </div>
        </ZKCard>


        <ZKCard v-if="!finishedRanking">
          <div class="progressBar">
            <q-linear-progress color="primary" track-color="secondary" :value="progress">
            </q-linear-progress>
          </div>

          <div>
            Vote on other people's statements ({{ currentRankIndex }} of {{ unrankedCommentList.length }})
          </div>

          <div class="rankingDiv">
            <div class="userComment">
              {{ displayCommentItem.comment }}
            </div>

            <div class="rankingButtonCluster">
              <ZKButton flat text-color-flex="secondary" icon="mdi-thumb-down" size="1.3rem"
                @click="rankComment('dislike')" />
              <ZKButton flat text-color-flex="secondary" label="Pass" @click="rankComment('pass')" />
              <ZKButton flat text-color-flex="secondary" icon="mdi-thumb-up" size="1.3rem"
                @click="rankComment('like')" />
            </div>
          </div>

        </ZKCard>
      </div>


    </div>
  </div>

</template>

<script setup lang="ts">
import { DummyCommentFormat, PossibleCommentRankingActions, usePostStore } from "@/stores/post";
import ZKButton from "../ui-library/ZKButton.vue";
import ZKCard from "../ui-library/ZKCard.vue";
import { ref } from "vue";

const props = defineProps<{
  postSlugId: string
}>()

const { getUnrankedComments, getPostBySlugId, updateCommentRanking } = usePostStore();

const postItem = getPostBySlugId(props.postSlugId);
const unrankedCommentList = getUnrankedComments(props.postSlugId)

let currentRankIndex = 0;

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

loadNextComment(currentRankIndex);

function checkFinishedRanking() {
  if ((unrankedCommentList.length - 1) < currentRankIndex) {
    finishedRanking.value = true;
    return true;
  } else {
    return false;
  }
}

function loadNextComment(index: number) {
  displayCommentItem = unrankedCommentList[index];
  updateProgressBar();
}

function updateProgressBar() {
  progress.value = currentRankIndex / unrankedCommentList.length;
}

function rankComment(commentAction: PossibleCommentRankingActions) {

  updateCommentRanking(props.postSlugId, displayCommentItem.index, commentAction);

  currentRankIndex += 1;
  updateProgressBar();

  const isDone = checkFinishedRanking();
  if (!isDone) {
    loadNextComment(currentRankIndex);
  }
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(100%, 30rem);
  margin: auto;
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
  text-align: center;
  font-weight: bold;
  font-size: 1.3rem;
  padding-top: 2rem;
}

.postBody {
  font-size: 1rem;
  text-align: center;
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
</style>