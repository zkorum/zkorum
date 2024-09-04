<template>
  <img class="flagImage" :src="imagePath" />
</template>

<script setup lang="ts">

defineProps<{
  imagePath: string
}>()

</script>

<style scoped>
.flagImage {
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: #e5e7eb;
  max-width: 100%;
}
</style>