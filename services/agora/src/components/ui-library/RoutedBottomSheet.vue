<template>
  <q-dialog
    :model-value="true"
    position="bottom"
    no-route-dismiss
    :allow-focus-outside="allowFocusOutside"
    class="routed-bottom-sheet"
    :class="{ 'routed-bottom-sheet--keyboard': viewport.bottomInset > 0 }"
    :style="viewportStyle"
    :aria-label="label"
    @update:model-value="handleModelChange"
  >
    <ZKBottomDialogContainer variant="expanded">
      <slot />
    </ZKBottomDialogContainer>
  </q-dialog>
</template>

<script setup lang="ts">
import { defaultDocument } from "@vueuse/core";
import { useVisibleViewport } from "src/utils/html/viewPort";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { nextTick, onUnmounted } from "vue";

import ZKBottomDialogContainer from "./ZKBottomDialogContainer.vue";

const props = defineProps<{
  dismissal: DismissalController;
  label: string;
  allowFocusOutside: boolean;
}>();
const { viewportStyle, viewport } = useVisibleViewport();
const previousFocus = defaultDocument?.activeElement;

async function handleModelChange(visible: boolean): Promise<void> {
  if (!visible) await props.dismissal.dismiss();
}

onUnmounted(async () => {
  // The background becomes interactive after the route render clears inert.
  await nextTick();
  if (
    previousFocus instanceof HTMLElement &&
    previousFocus.isConnected &&
    !previousFocus.closest("[inert]")
  ) {
    previousFocus.focus({ preventScroll: true });
  }
});
</script>

<style lang="scss">
.routed-bottom-sheet {
  .q-dialog__backdrop {
    background: rgb(20 16 36 / 30%);
  }

  .q-dialog__inner {
    padding: 0;
    inset-block-end: var(--visible-viewport-bottom-inset, 0px);
  }

  &--keyboard
    .q-dialog__inner.q-dialog__inner--minimized
    > .dialogContainer--expanded {
    min-height: 0;
    max-height: calc(var(--visible-viewport-height, 100dvh) * 0.9);
  }
}
</style>
