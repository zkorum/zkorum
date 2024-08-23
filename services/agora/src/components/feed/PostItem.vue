<template>
  <div>
    <div class="container">
      <ZKCard>
        <div class="innerContainer">
          <div class="topTag">
            <q-avatar size="3rem" color="primary" text-color="white">E</q-avatar>
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

          <div class="innerContainer" v-if="!compactMode && extendedPostData.payload.poll !== undefined">

            <poll-result-view :result="extendedPostData.payload.poll.result"
              :options="extendedPostData.payload.poll.options" :pollResponse="undefined" /> <!-- TODO: pollResponse -->
          </div>

          <div class="bottomButtons">
            <ZKButton :label="extendedPostData.metadata.commentCount.toString()" icon="mdi-comment"
              @click="(event) => jumpToComments(event)" />

            <!--
          <ZKButton icon="bar_chart" color-flex="light-blue-8" text-color-flex="white"
            @click="(event) => showResultClicked(event)" />
          -->

            <ZKButton icon="mdi-share-variant-outline" @click="(event) => shareClicked(event)" />

          </div>

        </div>
      </ZKCard>

      <div v-if="!compactMode">
        <ZKCard>
          <CommentSwiper :comment-list="commentList" />
        </ZKCard>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ExtendedPostData } from "@/shared/types/zod";
import { getTrimmedPseudonym, getTimeFromNow } from "src/utils/common";
import ZKButton from "../ui-library/ZKButton.vue";
import ZKCard from "../ui-library/ZKCard.vue";
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

<style scoped lang="scss">
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
}

.domain {
  font-weight: bold;
}

.titleDiv {
  font-size: 1.2rem;
  font-weight: bolder;
}

.bodyDiv {
  font-size: 1rem;
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

.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
