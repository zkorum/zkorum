<template>
  <div ref="element" class="card-decoration" :style="{ padding: padding }">
    <slot :element="element ?? undefined" />
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, type VNodeChild } from "vue";

defineProps<{
  padding: string;
}>();
defineSlots<{
  default(props: { element: HTMLElement | undefined }): VNodeChild;
}>();
const element = useTemplateRef<HTMLElement>("element");
</script>

<style scoped lang="scss">
.card-decoration {
  border-radius: 16px;
}
</style>
