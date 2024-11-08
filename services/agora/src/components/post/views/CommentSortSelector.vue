<template>
  <div>
    <ZKCard padding="1rem">
      <div class="swiperCluster">
        <div class="descriptionLabel">
          {{ description }}
        </div>
        <swiper-container ref="swipingElementRef" :slides-per-view="slidesPerView" :initial-slide="currentSlide"
          :scrollbar="true">
          <swiper-slide v-for="sortOptionItem in getCommentSortOptions()" :key="sortOptionItem.value"
            class="scrollPadding">
            <CommentSortItem :is-selected="commentSortPreference == sortOptionItem.value" :sort-item="sortOptionItem"
              @click="commentSortPreference = sortOptionItem.value" />
          </swiper-slide>
        </swiper-container>
      </div>
    </ZKCard>
  </div>
</template>

<script setup lang="ts">
import ZKCard from "src/components/ui-library/ZKCard.vue";
import CommentSortItem from "./CommentSortItem.vue";
import { onMounted, ref, watch } from "vue";
import {
  useCommentOptions,
  CommentSortingItemInterface,
} from "src/utils/component/comments";
import { useStorage, useWindowSize } from "@vueuse/core";
import { SwiperContainer } from "swiper/element";

const emit = defineEmits(["changedAlgorithm"]);

const { getCommentSortOptions } = useCommentOptions();

const slidesPerView = ref(4);

const currentSlide = ref(0);

const description = ref("");

const { width } = useWindowSize();

const commentSortPreference = useStorage(
  "comment-sort-preference-id",
  "popular"
);

const swipingElementRef = ref<SwiperContainer | null>(null);

onMounted(() => {
  updateSlide(commentSortPreference.value);

  initializeSlideCount();
});

watch(width, () => {
  initializeSlideCount();
});

watch(commentSortPreference, () => {
  updateSlide(commentSortPreference.value);

  emit("changedAlgorithm", commentSortPreference.value);
});

function updateSlide(sortId: string) {
  const sortItem = getSortItem(sortId);
  description.value = sortItem.description;
  currentSlide.value = sortItem.index;

  swipingElementRef.value?.swiper.slideTo(currentSlide.value);
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
    index: 0,
  };
}

function initializeSlideCount() {
  if (width.value < 300) {
    slidesPerView.value = 2;
  } else if (width.value < 400) {
    slidesPerView.value = 2.5;
  } else if (width.value < 500) {
    slidesPerView.value = 3.5;
  } else {
    slidesPerView.value = 4;
  }
}
</script>

<style scoped lang="scss">
.swiperCluster {
  cursor: pointer;
}

.descriptionLabel {
  text-align: left;
  color: $color-text-weak;
  font-size: 0.9rem;
  padding-bottom: 1rem;
}

.scrollPadding {
  padding-bottom: 1.5rem;
}
</style>
