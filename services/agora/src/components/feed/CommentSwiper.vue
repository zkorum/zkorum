<template>
  <div>
    <div class="title">
      Anonymized Comment
    </div>

    <swiper-container direction="vertical" slides-per-view="1" @swiperslidechange="onSlideChange" navigation="true"
      class="commentBlock">
      <swiper-slide v-for="comment in commentList" v-bind:key="comment" class="slideComponent">
        <div>
          {{ comment }}
        </div>

        <div class="thumbsButtonBlock">
          <ZKButton icon="thumb_up" />
          <ZKButton label="Pass" outline text-color-flex="black" />
          <ZKButton icon="thumb_down" />
        </div>
      </swiper-slide>
    </swiper-container>
  </div>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";

defineProps<{
  commentList: string[]
}>()

const onSlideChange = () => { // e: unknown
  console.log("slide changed")
  // const indexNumber: number = Number(e.detail[0].activeIndex);
  // console.log(indexNumber);
}


</script>

<style scoped>
.commentBlock {
  font-size: 1.2rem;
  width: 100%;
  height: 18rem;
  background-color: #ecfeff;
  border-radius: 15px;
}

.slideComponent {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
  justify-content: center;
}

.thumbsButtonBlock {
  display: flex;
  justify-content: space-between;
  width: min(100%, 20rem);
}


.title {
  font-size: 1.2rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 0.5rem;
}
</style>