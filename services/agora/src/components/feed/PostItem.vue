<template>
  <div>
    <div class="container">
      <div class="innerContainer postBackground">
        <div class="topTag">
          <q-avatar size="3rem" color="essec-blue" text-color="white">E</q-avatar>
          <div class="metadata">
            <div class="domain">
              {{ extendedPostData.author.domain }}
            </div>
            <div>
              {{ getTrimmedPseudonym(extendedPostData.author.pseudonym) }}
            </div>
            <div>
              {{ getTimeFromNow(extendedPostData.metadata.lastReactedAt) }}
            </div>
          </div>
        </div>

        <div class="postDiv">
          <div class="titleDiv">
            {{ extendedPostData.payload.title }}
          </div>

          <div class="bodyDiv">
            {{ processPostBody(extendedPostData.payload.body || '') }}
          </div>

        </div>

        <div class="bottomButtons">
          <ZKButton :label="extendedPostData.metadata.commentCount.toString()" icon="comment" color-flex="light-blue-8"
            text-color-flex="white" @click="(event) => jumpToComments(event)" />

          <!--
          <ZKButton icon="bar_chart" color-flex="light-blue-8" text-color-flex="white"
            @click="(event) => showResultClicked(event)" />
          -->

          <ZKButton icon="share" color-flex="light-blue-8" text-color-flex="white"
            @click="(event) => shareClicked(event)" />

        </div>

      </div>

      <div class="innerContainer postBackground" v-if="!compactMode">
        <div class="componentTitle">
          Vote on other people's statements
        </div>

        <CommentSwiper :comment-list="commentList" />
      </div>

      <div class="innerContainer postBackground" v-if="!compactMode && extendedPostData.payload.poll !== undefined">

        <div class="componentTitle">
          What other people think about the statement
        </div>

        <poll-result-view :result="extendedPostData.payload.poll.result"
          :options="extendedPostData.payload.poll.options" :pollResponse="undefined" /> <!-- TODO: pollResponse -->
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ExtendedPostData } from "@/shared/types/zod";
import { getTrimmedPseudonym, getTimeFromNow } from "src/utils/common";
import ZKButton from "../ui-library/ZKButton.vue";
import PollResultView from "../poll/PollResultView.vue";
import CommentSwiper from "./CommentSwiper.vue";
import { useRouter } from "vue-router";
import { ref } from "vue";

const router = useRouter();

const commentList = ref<string[]>([
  "This is dummy comment 1 This is dummy comment 1 This is dummy comment 1 This is dummy comment 1",
  "This is dummy comment 2 This is dummy comment 2 This is dummy comment 2 This is dummy comment 2",
  "This is dummy comment 3 This is dummy comment 3 This is dummy comment 3 This is dummy comment 3",
  "This is dummy comment 4",
  "This is dummy comment 5",
  "This is dummy comment 6",
  "This is dummy comment 7",
  "This is dummy comment 8",
]);

// const displayResults = ref(false);

const props = defineProps<{
  extendedPostData: ExtendedPostData,
  compactMode: boolean
}>()

function shareClicked(event: Event) {
  if (event) {
    event.preventDefault();
  }
}

/*
function showResultClicked(event: Event) {
  if (event) {
    event.preventDefault();
    displayResults.value = true;
  }
}
*/

function jumpToComments(event: Event) {
  if (event) {
    event.preventDefault();
    router.push({ name: "single-post", params: { postSlugId: props.extendedPostData.metadata.slugId } });
  }
}

function processPostBody(body: string) {
  if (body.length <= 200 || !props.compactMode) {
    return body;
  } else {
    return body.slice(0, 200) + "...";
  }
}

</script>

<style scoped>
.innerContainer {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.topTag {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.metadata {
  display: flex;
  flex-direction: column;
  gap: 0rem;
  font-size: 0.8rem;
}

.domain {
  font-weight: bold;
}

.titleDiv {
  font-size: 1.3rem;
  font-weight: bolder;
}

.bodyDiv {
  font-size: 1.1rem;
}

.postDiv {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bottomButtons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.commentItem {
  padding: 1rem;
}

.postBackground {
  background-color: #cffafe;
  border-radius: 15px;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
}

.componentTitle {
  font-size: 1.2rem;
  padding-top: 1rem;
  padding-left: 0.5rem;
}
</style>
