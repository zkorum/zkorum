<template>
  <slot />
</template>

<script setup lang="ts">
import {
  createPageMetadataController,
  type PageMetadataPolicy,
} from "src/utils/html/pageMetadata";
import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  watch,
} from "vue";

const props = defineProps<{ policy: PageMetadataPolicy }>();

let stopMetadata: (() => void) | undefined;

function activate(): void {
  if (stopMetadata !== undefined) {
    return;
  }
  const controller = createPageMetadataController(document);
  const stop = watch(
    [() => props.policy.robots, () => props.policy.browserTranslationAllowed],
    () => controller.apply(props.policy),
    { immediate: true }
  );
  stopMetadata = () => {
    stop();
    controller.restore();
  };
}

function deactivate(): void {
  stopMetadata?.();
  stopMetadata = undefined;
}

onMounted(activate);
onActivated(activate);
onDeactivated(deactivate);
onBeforeUnmount(deactivate);
</script>
