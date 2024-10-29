<template>
  <div>
    <div class="title">
      {{ title }}
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<style scoped lang="scss">
.title {
  padding-top: 1.5rem;
  padding-bottom: 2rem;
  font-size: 1.8rem;
}
</style>
