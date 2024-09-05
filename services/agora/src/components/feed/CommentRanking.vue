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

        <ZKCard>
          <div class="progressBar">
            <q-linear-progress :value="progress" />
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
                @click="rankComment('downvote')" />
              <ZKButton outline text-color-flex="secondary" label="Pass" size="1rem" @click="rankComment('pass')" />
              <ZKButton flat text-color-flex="secondary" icon="mdi-thumb-up" size="1.3rem"
                @click="rankComment('upvote')" />
            </div>
          </div>

        </ZKCard>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { DummyCommentFormat, usePostStore } from "@/stores/post";
import ZKButton from "../ui-library/ZKButton.vue";
import ZKCard from "../ui-library/ZKCard.vue";
import { ref } from "vue";

const props = defineProps<{
  postSlugId: string
}>()

const { getUnrankedComments, getPostBySlugId } = usePostStore();

const postItem = getPostBySlugId(props.postSlugId);
const unrankedCommentList = getUnrankedComments(props.postSlugId)

let displayCommentItem: DummyCommentFormat = {
  index: 0,
  userCommunityId: "",
  userCommunityImage: "",
  createdAt: new Date(),
  comment: "",
  numUpvotes: 0,
  numDownvotes: 0
}

let currentRankIndex = 0;
const progress = ref(0);

loadNextComment(currentRankIndex);

function loadNextComment(index: number) {
  displayCommentItem = unrankedCommentList[index];
  updateProgressBar();
}

function updateProgressBar() {
  progress.value = currentRankIndex / unrankedCommentList.length;
}

function rankComment(action: "upvote" | "downvote" | "pass") {
  currentRankIndex += 1;
  updateProgressBar();

  if (currentRankIndex < unrankedCommentList.length) {
    loadNextComment(currentRankIndex);
  } else {
    // done
  }

  console.log(action);
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
  font-size: 1.2rem;
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
</style>