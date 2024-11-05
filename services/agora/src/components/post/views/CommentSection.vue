<template>
  <div>
    <div class="container">
      <CommentSortSelector @changed-algorithm="(value) => (commentSortPreference = value)" />

      <div v-if="commentItems.length == 0" class="noCommentMessage">
        There are no comments in this post.
      </div>

      <div v-if="commentItems.length > 0" class="commentListFlex">
        <div v-for="(commentItem, index) in commentItems" :key="commentItem.commentSlugId">
          <CommentSingle :comment-item="commentItem" :post-slug-id="postSlugId" :is-ranked="props.commentRanking.rankedCommentList.get(index) != null
            " :ranked-action="getCommentItemRankStatus(index)"
            :highlight="initialCommentSlugId == commentItem.commentSlugId" />

          <Divider :style="{ width: '100%' }" />
        </div>
      </div>

      <!--
      <div
        v-if="commentSortPreference != 'surprising' && commentSortPreference != 'clusters' && commentSortPreference != 'more'"
        class="commentListFlex">
        <div v-for="(commentItem, index) in commentList" :id="commentItem.slugId" :key="index">
          <CommentSingle :comment-item="commentItem" :post-slug-id="postSlugId"
            :is-ranked="props.commentRanking.rankedCommentList.get(index) != null"
            :ranked-action="getCommentItemRankStatus(index)" :highlight="initialCommentSlugId == commentItem.slugId" />

          <Divider :style="{ width: '100%' }" />
        </div>

      </div>
      -->

      <div v-if="commentSortPreference == 'surprising'" :style="{ paddingTop: '1rem' }">
        <ZKCard padding="2rem">
          <div class="specialMessage">
            <q-icon name="mdi-wrench" size="4rem" />
            <div class="specialText">
              This sorting option is currently under development!
            </div>
          </div>
        </ZKCard>
      </div>

      <div v-if="commentSortPreference == 'clusters'" :style="{ paddingTop: '1rem' }">
        <ZKCard padding="2rem">
          <div class="specialMessage">
            <img src="/development/polis/example.png" class="polisExampleImg" />
            <div class="specialText">
              This visualization is currently a work-in-progress!
            </div>
          </div>
        </ZKCard>
      </div>

      <div v-if="commentSortPreference == 'more'" :style="{ paddingTop: '1rem' }">
        <ResearcherContactUsForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DummyCommentFormat,
  DummyCommentRankingFormat,
  PossibleCommentRankingActions,
} from "src/stores/post";
import CommentSingle from "./CommentSingle.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import ResearcherContactUsForm from "./algorithms/ResearcherContactUsForm.vue";
import { ref } from "vue";
import Divider from "primevue/divider";
import CommentSortSelector from "./CommentSortSelector.vue";
import { useBackendCommentApi } from "src/utils/api/comment";
import { ApiV1CommentFetchPost200ResponseInner } from "src/api";

const props = defineProps<{
  commentList: DummyCommentFormat[];
  postSlugId: string;
  commentRanking: DummyCommentRankingFormat;
  initialCommentSlugId: string;
}>();

const commentSortPreference = ref("");

const backendCommentApi = useBackendCommentApi();

const commentItems = ref<ApiV1CommentFetchPost200ResponseInner[]>([]);

fetchData();

async function fetchData() {
  if (props.postSlugId.length > 0) {
    const response = await backendCommentApi.fetchCommentsForPost(props.postSlugId);

    if (response != null) {
      commentItems.value = response;
      setTimeout(function () {
        scrollToComment();
      }, 1000);
    }
  }
}

function getCommentItemRankStatus(
  commentIndex: number
): PossibleCommentRankingActions {
  const action = props.commentRanking.rankedCommentList.get(commentIndex);
  if (action == null) {
    return "pass";
  } else {
    return action;
  }
}

function scrollToComment() {
  if (props.initialCommentSlugId != "") {
    const targetElement = document.getElementById(props.initialCommentSlugId);

    if (targetElement != null) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      console.log("Failed to locate ID: " + props.initialCommentSlugId);
    }
  }
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.noCommentMessage {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}

.specialMessage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.commentListFlex {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.polisExampleImg {
  width: 100%;
  border-radius: 15px;
}

.specialText {
  text-align: center;
  width: min(15rem, 100%);
}
</style>
