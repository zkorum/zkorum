<template>
  <div>
    <div class="container">
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
          {{ trimBody(extendedPostData.payload.body || '') }}
        </div>

        <poll-result-view v-if="extendedPostData.payload.poll !== undefined && displayPoll"
          :result="extendedPostData.payload.poll.result" :options="extendedPostData.payload.poll.options"
          :pollResponse="undefined" /> <!-- TODO: pollResponse -->
      </div>

      <div class="bottomButtons">
        <ZKButton :label="extendedPostData.metadata.commentCount.toString()" icon="comment" color-flex="grey-4"
          text-color-flex="teal-8" />

        <ZKButton label="23" icon="bar_chart" color-flex="grey-4" text-color-flex="teal-8" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ExtendedPostData } from "@/shared/types/zod";
import { getTrimmedPseudonym, getTimeFromNow } from "src/utils/common";
import ZKButton from "../ui-library/ZKButton.vue";
import PollResultView from "../poll/PollResultView.vue";

defineProps<{
  extendedPostData: ExtendedPostData,
  displayPoll: boolean
}>()

function trimBody(body: string) {
  if (body.length <= 200) {
    return body;
  } else {
    return body.slice(0, 200) + "...";
  }
}

</script>

<style scoped>
.container {
  background-color: #f1f5f9;
  border-radius: 15px;
  padding: 1rem;
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
  padding-bottom: 0.5rem;
}

.bodyDiv {
  font-size: 1.1rem;
  padding-bottom: 1rem;
}

.postDiv {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.bottomButtons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
