<template>
  <q-dialog
    v-bind="dialogKeyboardAttributes"
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
import { useRoutedDialogReturn } from "src/composables/ui/useRoutedDialogReturn";
import { useVisibleViewport } from "src/utils/html/viewPort";
import { loopDialogTabFocus } from "src/utils/ui/dialogKeyboard";
import type { DismissalController } from "src/utils/ui/dismissalController";
import type { HTMLAttributes } from "vue";

import ZKBottomDialogContainer from "./ZKBottomDialogContainer.vue";

const props = defineProps<{
  dismissal: DismissalController;
  label: string;
  allowFocusOutside: boolean;
  returnTarget: string | undefined;
}>();
const { viewportStyle, viewport } = useVisibleViewport();
useRoutedDialogReturn(props.returnTarget);

async function handleModelChange(visible: boolean): Promise<void> {
  if (!visible) await props.dismissal.dismiss();
}

function handleKeydown(event: KeyboardEvent): void {
  if (!props.allowFocusOutside) loopDialogTabFocus(event);
}

// QDialog forwards native listeners to its dialog root. Its component props
// omit keydown, so type this passthrough with Vue's native HTML attributes.
const dialogKeyboardAttributes = {
  onKeydown: handleKeydown,
} satisfies HTMLAttributes;
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
