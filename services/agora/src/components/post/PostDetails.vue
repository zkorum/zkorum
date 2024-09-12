<template>
  <div>
    <div class="container postPadding" :class="{ mobileHoverEffect: compactMode }">
      <div class="innerContainer">
        <PostMetadata :poster-name="extendedPostData.metadata.posterName"
          :poster-image-path="extendedPostData.metadata.posterImagePath"
          :created-at="extendedPostData.metadata.createdAt" :is-compat-size="true" />

        <div class="postDiv">
          <div class="titleDiv">
            {{ extendedPostData.payload.title }}
          </div>

          <div class="bodyDiv">
            {{ processPostBody(extendedPostData.payload.body || '') }}
          </div>

        </div>

        <div class="innerContainer" v-if="extendedPostData.payload.poll.hasPoll">
          <PollWrapper :user-vote="extendedPostData.userInteraction.pollVoting"
            :poll-options="extendedPostData.payload.poll.options" />
        </div>

        <div class="bottomButtons">

          <div class="leftButtonCluster">
            <ZKButton :outline="focusCommentElement ? false : true" color="primary"
              :text-color="focusCommentElement ? 'white' : 'secondary'"
              :label="extendedPostData.metadata.commentCount.toString()" icon="mdi-comment-text"
              @click.stop.prevent="clickedCommentButton()" />

            <ZKButton outline text-color="secondary" icon="mdi-swap-horizontal"
              :label="showRankingMode ? 'Comments' : 'Ranking'" @click.stop.prevent="clickedPostDetailsButton()"
              v-if="!props.compactMode" />

          </div>

          <div>
            <ZKButton outline text-color="secondary" icon="mdi-share-outline" @click.stop.prevent="shareClicked()" />
          </div>

        </div>
      </div>

      <CommentRanking :post-slug-id="extendedPostData.metadata.slugId" v-if="showRankingMode && !compactMode" />

      <div v-if="!compactMode && !showRankingMode">
        <div v-if="commentList.length > 0">
          <CommentSection :post-slug-id="extendedPostData.metadata.slugId" :comment-list="commentList"
            :comment-ranking="extendedPostData.userInteraction.commentRanking" />
        </div>

        <div v-if="commentList.length == 0" class="noCommentMessage">
          There are no comments in this post.
        </div>
      </div>
    </div>

    <FloatingBottomContainer v-if="!compactMode">
      <CommentComposer :show-controls="focusCommentElement" @cancel-clicked="cancelledCommentComposor()"
        @editor-focused="focusCommentElement = true" />
    </FloatingBottomContainer>

    <q-dialog v-model="showFallbackShareDialog">
      <q-card class="shareDialog">
        <q-card-section>
          <div class="text-h6">Share Link</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ sharePostUrl }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
import CommentSection from "./views/CommentSection.vue";
import PostMetadata from "./views/PostMetadata.vue";
import PollWrapper from "../poll/PollWrapper.vue";
import CommentRanking from "./views/CommentRanking.vue";
import FloatingBottomContainer from "../navigation/FloatingBottomContainer.vue";
import CommentComposer from "./views/CommentComposer.vue";
import { DummyPostDataFormat } from "src/stores/post";
import { ref } from "vue";
import { useWebShare } from "src/utils/share/WebShare";
import { useRoute, useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";

const props = defineProps<{
  extendedPostData: DummyPostDataFormat,
  compactMode: boolean,
}>();

const showRankingMode = ref(true);

const commentList = ref(props.extendedPostData.payload.comments);

// const { composeDummyCommentItem } = usePostStore();

const router = useRouter();
const route = useRoute();

const webShare = useWebShare()

const showFallbackShareDialog = ref(false);

const sharePostUrl = window.location.origin + "/post/" + props.extendedPostData.metadata.slugId;

const focusCommentElement = ref(false);

const action = useRouteQuery("action");
if (action.value == "comment") {
  focusCommentElement.value = true;
}

function cancelledCommentComposor() {
  focusCommentElement.value = false;
}

function clickedCommentButton() {
  if (route.name != "single-post") {
    router.push({
      name: "single-post",
      params: { postSlugId: props.extendedPostData.metadata.slugId },
      query: { action: "comment" }
    })
  } else {
    focusCommentElement.value = !focusCommentElement.value;
  }
}

function clickedPostDetailsButton() {
  showRankingMode.value = !showRankingMode.value;
}

function shareClicked() {
  if (webShare.isSupportedSharePlatform()) {
    webShare.share("Agora - " + props.extendedPostData.payload.title, sharePostUrl);
  } else {
    showFallbackShareDialog.value = true;
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
  font-weight: 500;
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
  gap: 2rem;
}

.leftButtonCluster {
  display: flex;
  gap: 1rem;
}

.shareDialog {
  min-width: 20rem;
}

.postPadding {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

@media (hover: hover) and (pointer: fine) {
  .mobileHoverEffect:hover {
    background-color: #f5f5f5;
    border-radius: 15px;
  }
}

.noCommentMessage {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}
</style>
