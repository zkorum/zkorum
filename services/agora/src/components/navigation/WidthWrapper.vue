<template>
  <div class="innerStyle" :style="{ width: 'min(' + width + ', 100%)' }">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  width: string;
}>();
</script>

<style scoped>
.innerStyle {
  margin: auto;
}
</style>
