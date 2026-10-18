<template>
  <div class="select-popup-actions" :style="{ minHeight: `${minHeight}px` }">
    <q-btn flat no-caps color="primary" :label="label" @click="emit('close')" />
  </div>
</template>

<script setup lang="ts">
import { QBtn } from "quasar";

defineProps<{
  label: string;
  minHeight: number;
}>();
const emit = defineEmits<{ close: [] }>();
</script>

<style scoped lang="scss">
.select-popup-actions {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-inline: 0.5rem;
  background: white;
  border-block-end: 1px solid #e5e7eb;
}
</style>
