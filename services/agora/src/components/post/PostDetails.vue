<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <ZKHoverEffect :enable-hover="compactMode">
      <div class="container postPadding">
        <div class="innerContainer">
          <PostMetadata :poster-name="extendedPostData.metadata.posterName"
            :poster-image-path="extendedPostData.metadata.posterImagePath"
            :created-at="extendedPostData.metadata.createdAt" :is-compat-size="true" :skeleton-mode="skeletonMode" />

          <div class="postDiv">
            <div>
              <div v-if="!skeletonMode" class="titleDiv">
                {{ extendedPostData.payload.title }}
                <div :class="{ extraTitleBottomPadding: extendedPostData.payload.body.length == 0 }">
                </div>
              </div>

              <div v-if="skeletonMode" class="titleDiv">
                <Skeleton width="100%" height="4rem" border-radius="16px"></Skeleton>
              </div>
            </div>

            <div v-if="extendedPostData.payload.body.length > 0" class="bodyDiv">
              <span :class="{ truncate: compactMode }" v-html="extendedPostData.payload.body"></span>
            </div>
          </div>

          <div v-if="extendedPostData.payload.poll.hasPoll" class="pollContainer">
            <PollWrapper :poll-options="extendedPostData.payload.poll.options"
              :post-slug-id="extendedPostData.metadata.slugId"
              :user-response="extendedPostData.userInteraction.pollResponse" />
          </div>

          <div class="bottomButtons">
            <div class="leftButtonCluster">
              <div v-if="!skeletonMode">
                <ZKButton color="button-background-color" text-color="black" :label="(
                  extendedPostData.metadata.commentCount + commentCountOffset
                ).toString()
                  " icon="mdi-comment-outline" @click.stop.prevent="clickedCommentButton()" />
              </div>
              <div v-if="skeletonMode">
                <Skeleton width="3rem" height="2rem" border-radius="16px"></Skeleton>
              </div>
            </div>

            <div>
              <div v-if="!skeletonMode">
                <ZKButton color="button-background-color" text-color="black" icon="mdi-export-variant"
                  @click.stop.prevent="shareClicked()" />
              </div>
              <div v-if="skeletonMode">
                <Skeleton width="3rem" height="2rem" border-radius="16px"></Skeleton>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!compactMode" ref="commentSectionRef">
          <CommentSection :key="commentCountOffset" :post-slug-id="extendedPostData.metadata.slugId"
            :comment-list="commentList" :comment-ranking="extendedPostData.userInteraction.commentRanking"
            :initial-comment-slug-id="commentSlugId" />
        </div>
      </div>
    </ZKHoverEffect>

    <FloatingBottomContainer v-if="!compactMode">
      <CommentComposer :show-controls="focusCommentElement" :post-slug-id="extendedPostData.metadata.slugId"
        @cancel-clicked="cancelledCommentComposor()" @submitted-comment="submittedComment()"
        @editor-focused="focusCommentElement = true" />
    </FloatingBottomContainer>
  </div>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
import CommentSection from "./views/CommentSection.vue";
import PostMetadata from "./views/PostMetadata.vue";
import PollWrapper from "../poll/PollWrapper.vue";
import FloatingBottomContainer from "../navigation/FloatingBottomContainer.vue";
import CommentComposer from "./views/CommentComposer.vue";
import { DummyPostDataFormat, usePostStore } from "src/stores/post";
import { onMounted, ref } from "vue";
import { useWebShare } from "src/utils/share/WebShare";
import { useRoute, useRouter } from "vue-router";
import { useRouteQuery } from "@vueuse/router";
import ZKHoverEffect from "../ui-library/ZKHoverEffect.vue";
import Skeleton from "primevue/skeleton";

const props = defineProps<{
  extendedPostData: DummyPostDataFormat;
  compactMode: boolean;
  skeletonMode: boolean;
}>();

const commentSlugId = useRouteQuery("commentSlugId", "", { transform: String });

const commentCountOffset = ref(0);

const commentList = ref(props.extendedPostData.payload.comments);

const commentSectionRef = ref<HTMLElement | null>(null);

// const { composeDummyCommentItem } = usePostStore();

const router = useRouter();
const route = useRoute();

const { loadPostData } = usePostStore();

const webShare = useWebShare();

const focusCommentElement = ref(false);

const action = useRouteQuery("action");

onMounted(() => {
  if (action.value == "comment") {
    setTimeout(() => {
      scrollToCommentSection();
    }, 100);
  }
});

function scrollToCommentSection() {
  console.log(commentSectionRef.value);
  commentSectionRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });

}

async function submittedComment() {
  commentCountOffset.value += 1;
  focusCommentElement.value = false;
  scrollToCommentSection();
  await loadPostData(false);
}

function cancelledCommentComposor() {
  focusCommentElement.value = false;
}

function clickedCommentButton() {
  if (route.name != "single-post") {
    router.push({
      name: "single-post",
      params: { postSlugId: props.extendedPostData.metadata.slugId },
      query: { action: "comment" },
    });
  } else {
    focusCommentElement.value = !focusCommentElement.value;
  }
}

function shareClicked() {
  const sharePostUrl =
    window.location.origin + "/post/" + props.extendedPostData.metadata.slugId;
  webShare.share(
    "Agora - " + props.extendedPostData.payload.title,
    sharePostUrl
  );
}
</script>

<style scoped lang="scss">
.innerContainer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pollContainer {
  padding-bottom: 1rem;
}

.titleDiv {
  font-size: 1.2rem;
}

.bodyDiv {
  font-size: 1rem;
  padding-bottom: 1rem;
  font-weight: 400;
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
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.leftButtonCluster {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.postPadding {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
}

.extraTitleBottomPadding {
  padding-bottom: 1rem;
}
</style>
