<template>
  <div>
    <div class="container">
      <div class="swiperCluster">
        <swiper-container :slides-per-view="slidesPerView" :initial-slide="initialSlide">
          <swiper-slide v-for="sortOptionItem in getCommentSortOptions()" :key="sortOptionItem.value">
            <div>
              <CommentSortItem :is-selected="commentSortPreference == sortOptionItem.value" :sort-item="sortOptionItem"
                @click="commentSortPreference = sortOptionItem.value" />
            </div>
          </swiper-slide>
        </swiper-container>
      </div>

      <div class="descriptionLabel">
        {{ description }}
      </div>

      <div v-if="commentSortPreference != 'surprising' && commentSortPreference != 'clusters' && commentSortPreference != 'more'"
        class="commentListFlex">
        <div v-for="(commentItem, index) in commentList" :key="index">
          <CommentSingle :comment-item="commentItem" :post-slug-id="postSlugId" :comment-ranking="commentRanking" />
        </div>
      </div>

      <div v-if="commentSortPreference == 'surprising'" :style="{paddingTop: '1rem'}">
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
import { DummyCommentFormat, DummyCommentRankingFormat } from "src/stores/post";
import { useStorage, useWindowSize } from "@vueuse/core";
import { CommentSortingItemInterface, useCommentOptions } from "src/utils/component/comments";
import CommentSingle from "./CommentSingle.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import CommentSortItem from "./CommentSortItem.vue";
import ResearcherContactUsForm from "./algorithms/ResearcherContactUsForm.vue";
import { onMounted, ref, watch } from "vue";

defineProps<{
  commentList: DummyCommentFormat[],
  postSlugId: string,
  commentRanking: DummyCommentRankingFormat
}>();

const slidesPerView = ref(4.5);

const { width } = useWindowSize();

const { getCommentSortOptions } = useCommentOptions();

const commentSortPreference = useStorage("comment-sort-preference-id", "popular");

const initialSlide = ref(0);

const description = ref("");

updateDescription(commentSortPreference.value);

onMounted(() => {
  initializeSlideCount();
});

watch(width, () => {
  initializeSlideCount();
});

watch(commentSortPreference, () => {
  updateDescription(commentSortPreference.value);
});

function initializeSlideCount() {
  if (width.value < 300) {
    slidesPerView.value = 2;
  } else if (width.value < 400) {
    slidesPerView.value = 2.5;
  } else if (width.value < 500) {
    slidesPerView.value = 3.5;
  } else {
    slidesPerView.value = 4.5;
  }
}

function updateDescription(sortId: string) {
  const sortItem = getSortItem(sortId);
  description.value = sortItem.description;
  initialSlide.value = sortItem.index;
}

function getSortItem(sortId: string): CommentSortingItemInterface {
  const sortOptionList = getCommentSortOptions();
  for (let i = 0; i < sortOptionList.length; i++) {
    const sortItem = sortOptionList[i];
    if (sortItem.value == sortId) {
      return sortItem;
    }
  }

  return {
    label: "",
    icon: "",
    value: "",
    description: "",
    index: 0
  };
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.descriptionLabel {
  text-align: center;
  color: $color-text-weak;
}

.specialMessage {
  display:flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.commentListFlex {
  display:flex;
  flex-direction: column;
  gap: 1rem;
}

.swiperCluster {
  cursor: pointer;
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
