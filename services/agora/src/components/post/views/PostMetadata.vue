<template>
  <div>
    <div class="container">
      <div class="metadata">
        <div>
          <Avatar v-if="!skeletonMode" variant="bauhaus" name="Mujahid Anuar" :colors="colors" class="avatarIcon" />

          <Skeleton v-if="skeletonMode" shape="circle" size="2.5rem">
          </Skeleton>
        </div>

        <div>
          <div v-if="!skeletonMode">
            {{ posterName }}
          </div>
          <Skeleton v-if="skeletonMode" width="5rem"></Skeleton>
        </div>

        <div>•</div>

        <div>
          <div v-if="!skeletonMode">
            {{ getTimeFromNow(new Date(createdAt)) }}
          </div>
          <Skeleton v-if="skeletonMode" width="2rem"></Skeleton>
        </div>

        <div></div>
      </div>

      <div>
        <div v-if="!skeletonMode">
          <ZKButton flat text-color="color-text-weak" icon="mdi-dots-vertical"
            @click.stop.prevent="clickedMoreIcon()" />
        </div>
        <Skeleton v-if="skeletonMode" width="3rem" height="2rem" border-radius="16px"></Skeleton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTimeFromNow } from "src/utils/common";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useBottomSheet } from "src/utils/ui/bottomSheet";
import Skeleton from "primevue/skeleton";
import Avatar from "vue-boring-avatars";

defineProps<{
  posterName: string;
  posterImagePath: string;
  createdAt: string;
  skeletonMode: boolean;
}>();

const colors = ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"];

const { showPostOptionSelector } = useBottomSheet();

function clickedMoreIcon() {
  showPostOptionSelector();
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  color: $color-text-weak;
}

.iconSizeLarge {
  width: 4rem;
}

.avatarIcon {
  width: 2rem;
  margin-right: 0.5rem;
}

.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  height: 100%;
  font-size: 0.9rem;
}

.reportDialog {
  background-color: white;
}
</style>
