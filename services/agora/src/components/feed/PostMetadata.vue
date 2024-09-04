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
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTimeFromNow } from "@/utils/common";

defineProps<{
  posterName: string
  posterImagePath: string
  createdAt: Date
}>()

</script>

<style scoped>
.container {
  display: flex;
  gap: 1rem;
  align-items: center;
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