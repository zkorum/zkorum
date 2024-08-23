<template>
  <div>
    <swiper-container slides-per-view="1" @swiperslidechange="onSlideChange" navigation="true" class="commentBlock">
      <swiper-slide v-for="comment in commentList" v-bind:key="comment" class="slideComponent">
        <div class="userComment">
          {{ comment }}
        </div>

        <div class="thumbsButtonBlock">
          <ZKButton icon="mdi-thumb-up" />
          <ZKButton label="Pass" outline text-color-flex="black" />
          <ZKButton icon="mdi-thumb-down" />
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

<style scoped lang="scss">
.commentBlock {
  font-size: 1.2rem;
  width: 100%;
  height: 18rem;
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
  flex-wrap: wrap;
  width: min(100%, 15rem);
}

.userComment {
  width: min(100%, 30rem);
  text-align: center;
}
</style>