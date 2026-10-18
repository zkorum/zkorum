<template>
  <div
    v-if="!hideBottomBarForRoute"
    v-show="isActive"
    aria-hidden="true"
    :style="{ blockSize: `${barHeight}px` }"
  />
  <Teleport v-if="!hideBottomBarForRoute" to="body">
    <div
      v-show="isActive"
      ref="bottomBar"
      class="bottomBar"
      :style="{
        ...barStyle,
        ...viewportStyle,
      }"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  useElementSize,
  useEventListener,
  useResizeObserver,
} from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import { useNavigationStore } from "src/stores/navigation";
import { useVisibleViewport } from "src/utils/html/viewPort";
import {
  isConversationOnboardingRoutePath,
  isConversationRoutePath,
} from "src/utils/router/conversationRouteContext";
import {
  computed,
  onActivated,
  onDeactivated,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute } from "vue-router";

const props = withDefaults(
  defineProps<{
    respectDrawerOffset?: boolean;
    anchorElement?: HTMLElement | undefined;
  }>(),
  { respectDrawerOffset: true, anchorElement: undefined }
);

const $q = useQuasar();
const route = useRoute();
const { drawerBehavior, drawerWidth } = storeToRefs(useNavigationStore());
const anchorRect = ref<DOMRectReadOnly | undefined>(undefined);
const bottomBar = useTemplateRef<HTMLElement>("bottomBar");
const isActive = ref(true);
const { viewportStyle } = useVisibleViewport();
const { height: barHeight } = useElementSize(bottomBar, undefined, {
  box: "border-box",
});
onActivated(() => {
  isActive.value = true;
});
onDeactivated(() => {
  isActive.value = false;
});
function updateAnchorRect(): void {
  anchorRect.value = isActive.value
    ? props.anchorElement?.getBoundingClientRect()
    : undefined;
}

const activeAnchor = computed(() =>
  isActive.value ? props.anchorElement : undefined
);
useResizeObserver(activeAnchor, updateAnchorRect);
useEventListener(
  () => (activeAnchor.value === undefined ? undefined : window),
  "resize",
  updateAnchorRect,
  { passive: true }
);
watch(activeAnchor, updateAnchorRect, { immediate: true, flush: "post" });

const hideBottomBarForRoute = computed(() => {
  const routePath = route.path;
  return (
    !isConversationRoutePath(routePath) ||
    isConversationOnboardingRoutePath(routePath)
  );
});

const barStyle = computed(() => {
  const rect = anchorRect.value;
  if (rect !== undefined) {
    return {
      left: `${rect.left + rect.width / 2}px`,
      transform: "translateX(-50%)",
      width: `${rect.width}px`,
    };
  }

  const isRtl = $q.lang.rtl;
  if (props.respectDrawerOffset && drawerBehavior.value === "desktop") {
    const dw = drawerWidth.value;
    // In RTL the drawer is on the right, so offset the center leftward
    const positionProp = isRtl ? "right" : "left";
    return {
      [positionProp]: `calc(50% + ${dw / 2}px)`,
      transform: isRtl ? "translateX(50%)" : "translateX(-50%)",
      width: `min(35rem, calc(100vw - ${dw}px - 1rem))`,
    };
  }
  return {
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(35rem, 100%)",
  };
});
</script>

<style scoped lang="scss">
.bottomBar {
  --floating-bottom-clearance: calc(0.5rem + env(safe-area-inset-bottom));

  box-sizing: border-box;
  position: fixed;
  inset-block-end: var(--visible-viewport-bottom-inset, 0px);
  z-index: 100;
  padding-block-end: var(--floating-bottom-clearance);
  padding-inline: 0.5rem;
  padding-block-start: 1.5rem;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    $app-background-color 40%
  );
  pointer-events: none;
  display: flex;
  flex-direction: column;
  max-block-size: var(--visible-viewport-height, 100dvh);

  > * {
    min-block-size: 0;
    pointer-events: auto;
  }
}
</style>
