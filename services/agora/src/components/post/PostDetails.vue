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
              icon="mdi-comment-text" @click.stop.prevent="clickedCommentButton()" />

            <ZKButton :outline="!showCommentSection" :color-flex="showCommentSection ? 'secondary' : ''"
              :text-color-flex="showCommentSection ? '' : 'secondary'" icon="mdi-post"
              @click.stop.prevent="clickedPostDetailsButton()" v-if="!compactMode" />

            <ZKButton :outline="true" :color-flex="'secondary'" :text-color-flex="'secondary'" icon="mdi-post"
              @click.stop.prevent="clickedPostDetailsButton()" v-if="compactMode" />

          </div>

          <div>
            <ZKButton outline text-color-flex="secondary" icon="mdi-share-outline"
              @click.stop.prevent="shareClicked()" />
          </div>

        </div>
      </div>

      <CommentRanking :post-slug-id="extendedPostData.metadata.slugId" v-if="!showCommentSection && !compactMode" />

      <div v-if="!compactMode && showCommentSection">
        <div v-if="commentList.length > 0">
          <CommentSection :post-slug-id="extendedPostData.metadata.slugId" :comment-list="commentList"
            :comment-ranking="extendedPostData.userInteraction.commentRanking" />
        </div>

        <div v-if="commentList.length == 0">
          There are no comments in this post.
        </div>
      </div>

    </div>

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
import CommentSection from "../feed/CommentSection.vue";
import PostMetadata from "../feed/PostMetadata.vue";
import PollWrapper from "../poll/PollWrapper.vue";
import CommentRanking from "./CommentRanking.vue";
import { DummyPostDataFormat } from "src/stores/post";
import { ref } from "vue";
import { useWebShare } from "src/utils/share/WebShare";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
  extendedPostData: DummyPostDataFormat,
  compactMode: boolean,
  showCommentSection: boolean
}>();

const commentList = ref(props.extendedPostData.payload.comments);

// const { composeDummyCommentItem } = usePostStore();

const router = useRouter();
const route = useRoute();

const webShare = useWebShare()

const showFallbackShareDialog = ref(false);

const sharePostUrl = window.location.origin + "/post/" + props.extendedPostData.metadata.slugId;

/*
function replyButtonClicked() {
  const commentItem = composeDummyCommentItem(commentComposerText.value, commentList.value.length, new Date());
  commentList.value.unshift(commentItem);

  commentComposerText.value = "";
}
*/

function clickedCommentButton() {
  // TODO: scroll down to comment section
}

function clickedPostDetailsButton() {
  if (route.name != "single-post") {
    router.push({ name: "single-post", params: { postSlugId: props.extendedPostData.metadata.slugId, displayMode: "" } })
  } else {
    if (props.showCommentSection) {
      router.push({ name: "single-post", params: { postSlugId: props.extendedPostData.metadata.slugId, displayMode: "ranking" } })
    } else {
      router.push({ name: "single-post", params: { postSlugId: props.extendedPostData.metadata.slugId, displayMode: "" } })
    }
    // showCommentSection.value = !showCommentSection.value;
    //console.log("!")
    //route.params.displayMode = ""
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
  gap: 2rem;
}

.leftButtonCluster {
  display: flex;
  gap: 1rem;
}

.shareDialog {
  min-width: 20rem;
}
</style>
