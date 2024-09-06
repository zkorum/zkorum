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
        <ZKButton flat text-color-flex="primary" icon="mdi-dots-vertical" @click.stop.prevent="clickedMoreIcon()" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTimeFromNow } from "@/utils/common";
import ZKButton from "../ui-library/ZKButton.vue";

defineProps<{
  posterName: string
  posterImagePath: string
  createdAt: Date
}>()

function clickedMoreIcon() {
  // Add later
}

</script>

<style scoped>
.container {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.iconSizeLarge {
  width: 4rem;
}

.companyIcon {
  border-radius: 50%;
  width: 3rem;
}

.metadata {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  height: 100%;
}
</style>