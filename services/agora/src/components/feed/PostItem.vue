<template>
  <div>
    <div class="container">
      <ZKCard>
        <div class="innerContainer">
          <PostMetadata :community-id="extendedPostData.metadata.communityId"
            :created-at="extendedPostData.metadata.createdAt" :isCompatSize="false" />

          <div class="postDiv">
            <div class="titleDiv">
              {{ extendedPostData.payload.title }}
            </div>

            <div class="bodyDiv">
              {{ processPostBody(extendedPostData.payload.body || '') }}
            </div>

          </div>

          <div class="innerContainer" v-if="!compactMode && extendedPostData.payload.poll.hasPoll">
            <PollWrapper :user-vote="extendedPostData.userInteraction.voting"
              :poll-options="extendedPostData.payload.poll.options" />
            <!-- TODO: pollResponse -->
          </div>

          <div class="bottomButtons">

            <div class="leftButtonCluster">
              <ZKButton outline text-color-flex="secondary" :label="extendedPostData.metadata.commentCount.toString()"
                icon="mdi-chat-outline" />

              <ZKButton :outline="!showCommentComposer" :color-flex="showCommentComposer ? 'secondary' : ''"
                :text-color-flex="showCommentComposer ? '' : 'secondary'" icon="mdi-reply"
                @click="(event) => clickedCommentButton(event)" />

            </div>


            <!--
            <ZKButton icon="bar_chart" color-flex="light-blue-8" text-color-flex="white"
              @click="(event) => showResultClicked(event)" />
            -->

            <ZKButton outline text-color-flex="secondary" icon="mdi-share" @click="(event) => shareClicked(event)" />

          </div>

          <div v-if="!compactMode && showCommentComposer" class="newCommentBlock" ref="newCommentRef">
            <q-input outline v-model="commentComposerText" label="Add a comment" class="newCommentInput" />
            <div>
              <ZKButton outline text-color-flex="secondary" label="Reply" @click="replyButtonClicked()"
                :disable="commentComposerText.length == 0" />
            </div>
          </div>

        </div>
      </ZKCard>

      <!--
      <div v-if="!compactMode">
        <ZKCard>
          <CommentSwiper :comment-list="commentList" />
        </ZKCard>
      </div>
      -->

      <div v-if="!compactMode && commentList.length > 0">
        <CommentSection :comment-list="commentList" />
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
import ZKCard from "../ui-library/ZKCard.vue";
// import CommentSwiper from "./CommentSwiper.vue";
import CommentSection from "./CommentSection.vue";
import PostMetadata from "./PostMetadata.vue";
import PollWrapper from "../poll/PollWrapper.vue";
import { DummyPostDataFormat, usePostStore } from "@/stores/post";
import { ref } from "vue";

const showCommentComposer = ref(false);
const commentComposerText = ref("");

const props = defineProps<{
  extendedPostData: DummyPostDataFormat,
  compactMode: boolean
}>()

const commentList = ref(props.extendedPostData.payload.comments);

const { composeDummyCommentItem } = usePostStore();

const newCommentRef = ref<HTMLElement | null>(null);

function replyButtonClicked() {
  const commentItem = composeDummyCommentItem(commentComposerText.value, commentList.value.length);
  commentList.value.unshift(commentItem);

  commentComposerText.value = "";
}

function clickedCommentButton(event: Event) {
  if (event) {
    event.stopPropagation();
  }

  showCommentComposer.value = !showCommentComposer.value;

  if (showCommentComposer.value) {
    setTimeout(function () {
      if (newCommentRef.value) {
        newCommentRef.value.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

}

function shareClicked(event: Event) {
  if (event) {
    event.preventDefault();
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.newCommentInput {
  width: calc(100% - 5rem);
}

.newCommentBlock {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.leftButtonCluster {
  display: flex;
  gap: 1rem;
}
</style>
