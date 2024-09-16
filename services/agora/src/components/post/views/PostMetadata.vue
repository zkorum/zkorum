<template>
  <div>
    <div class="container">

      <div class="metadata">
        <img :src="posterImagePath" class="companyIcon" />

        <div>
          {{ posterName }}
        </div>

        <div>
          •
        </div>

        <div>
          {{ getTimeFromNow(createdAt) }}
        </div>

        <div>
        </div>
      </div>

      <div>
        <ZKButton flat text-color="color-text-weak" icon="mdi-dots-vertical" @click.stop.prevent="clickedMoreIcon()" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { getTimeFromNow } from "src/utils/common";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useBottomSheet } from "src/utils/ui/bottomSheet";

defineProps<{
  posterName: string
  posterImagePath: string
  createdAt: Date
}>();

const { showPostOptionSelector } = useBottomSheet();

function clickedMoreIcon() {
  showPostOptionSelector(false);
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  color: $color-text-weak;
}

.iconSizeLarge {
  width: 4rem;
}

.companyIcon {
  border-radius: 50%;
  width: 2.5rem;
  margin-right: 0.5rem;
}

.metadata {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  height: 100%;
}

.reportDialog {
  background-color: white;
}
</style>