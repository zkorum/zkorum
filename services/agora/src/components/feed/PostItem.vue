<template>
  <div>
    <div class="container">
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
          <!-- TODO: pollResponse -->
        </div>

        <div class="bottomButtons">

          <div class="leftButtonCluster">
            <ZKButton outline text-color-flex="secondary" :label="extendedPostData.metadata.commentCount.toString()"
              icon="mdi-chat-outline" @click.stop.prevent="clickedCommentButton()" />

            <ZKButton :outline="!showCommentComposer" :color-flex="showCommentComposer ? 'secondary' : ''"
              :text-color-flex="showCommentComposer ? '' : 'secondary'" icon="mdi-reply"
              @click.stop.prevent="clickedReplyButton()" v-if="!compactMode" />

          </div>

          <div>
            <ZKButton outline text-color-flex="secondary" icon="mdi-share-outline"
              @click.stop.prevent="shareClicked()" />
          </div>

        </div>

        <div v-if="!compactMode && showCommentComposer" class="newCommentBlock" ref="newCommentRef">
          <q-input outline v-model="commentComposerText" label="Add a comment" class="newCommentInput" />
          <div>
            <ZKButton outline text-color-flex="secondary" label="Reply" @click="replyButtonClicked()"
              :disable="commentComposerText.length == 0" />
          </div>
        </div>

      </div>

      <div v-if="!compactMode && commentList.length > 0">
        <CommentSection :post-slug-id="extendedPostData.metadata.slugId" :comment-list="commentList"
          :comment-ranking="extendedPostData.userInteraction.commentRanking" />
      </div>

      <q-dialog v-model="showFallbackShareDialog">
        <q-card>
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

  </div>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
// import CommentSwiper from "./CommentSwiper.vue";
import CommentSection from "./CommentSection.vue";
import PostMetadata from "./PostMetadata.vue";
import PollWrapper from "../poll/PollWrapper.vue";
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import { ref } from "vue";
import { useWebShare } from "src/utils/share/WebShare";
import { useRouter } from "vue-router";

const showCommentComposer = ref(false);
const commentComposerText = ref("");

const props = defineProps<{
  extendedPostData: DummyPostDataFormat,
  compactMode: boolean
}>()

const commentList = ref(props.extendedPostData.payload.comments);

const { composeDummyCommentItem } = usePostStore();

const webShare = useWebShare()
const router = useRouter();

const newCommentRef = ref<HTMLElement | null>(null);

const showFallbackShareDialog = ref(false);

const sharePostUrl = window.location.origin + "/a/" + props.extendedPostData.metadata.communityId + "/post/" + props.extendedPostData.metadata.slugId;

function replyButtonClicked() {
  const commentItem = composeDummyCommentItem(commentComposerText.value, commentList.value.length, new Date());
  commentList.value.unshift(commentItem);

  commentComposerText.value = "";
}

function clickedCommentButton() {
  router.push({
    name: "single-post",
    params: {
      communityId: props.extendedPostData.metadata.communityId,
      postSlugId: props.extendedPostData.metadata.slugId
    }
  });
}

function clickedReplyButton() {

  showCommentComposer.value = !showCommentComposer.value;

  if (showCommentComposer.value) {
    setTimeout(function () {
      if (newCommentRef.value) {
        newCommentRef.value.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

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
  gap: 4rem;
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
