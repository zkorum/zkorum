<template>
  <div>
    <div class="container">
      <div class="metadata">
        <div>
          <Avatar v-if="!skeletonMode" variant="bauhaus" :name="posterUserName" :colors="boringAvatarColors"
            class="avatarIcon" />

          <Skeleton v-if="skeletonMode" shape="circle" size="2.5rem">
          </Skeleton>
        </div>

        <div class="userNameTime">
          <div>
            <div v-if="!skeletonMode">
              {{ posterUserName }}
            </div>
            <Skeleton v-if="skeletonMode" width="5rem"></Skeleton>
          </div>

          <div>
            <div v-if="!skeletonMode">
              {{ getTimeFromNow(new Date(createdAt)) }}
            </div>
            <Skeleton v-if="skeletonMode" width="2rem"></Skeleton>
          </div>
        </div>

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
import { boringAvatarColors } from "src/utils/ui/profilePicture";

defineProps<{
  posterUserName: string;
  posterImagePath: string;
  createdAt: string;
  skeletonMode: boolean;
}>();

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
  width: 2.5rem;
  margin-right: 0.5rem;
}

.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.reportDialog {
  background-color: white;
}

.userNameTime {
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
