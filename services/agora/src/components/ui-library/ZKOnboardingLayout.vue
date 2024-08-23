<template>
  <div>
    <div>
      {{ title }}
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">

defineProps<{
  title: string
}>()
</script>

<style scoped lang="scss"></style>