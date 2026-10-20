<template>
  <div ref="actions" class="select-popup-actions">
    <ZKButton
      class="select-popup-actions__button"
      button-type="standardButton"
      color="primary"
      text-color="white"
      :label="label"
      @click="emit('close')"
    />
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from "@vueuse/core";
import { useTemplateRef, watch } from "vue";

import ZKButton from "./ZKButton.vue";

defineProps<{
  label: string;
}>();
const emit = defineEmits<{
  close: [];
  resize: [height: number];
}>();

const actions = useTemplateRef<HTMLElement>("actions");
const { height } = useElementSize(actions, undefined, { box: "border-box" });
// Virtual scrolling needs the actual sticky height, including enlarged text.
watch(height, (value) => emit("resize", value));
</script>

<style scoped lang="scss">
.select-popup-actions {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: $app-background-color;
  border-block-end: 1px solid $color-border-weak;
}

.select-popup-actions .select-popup-actions__button {
  flex: 1;
  min-height: 2.75rem;
  line-height: 1.25;
  font-weight: var(--font-weight-semibold);
}
</style>
