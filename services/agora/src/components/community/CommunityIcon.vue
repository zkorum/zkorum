<template>
  <img class="flagImage" :src="imagePath" :style="{ width: size }" />
</template>

<script setup lang="ts">
defineProps<{
  imagePath: string;
  size: string;
}>();
</script>

<style scoped>
.flagImage {
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: #e5e7eb;
}
</style>
