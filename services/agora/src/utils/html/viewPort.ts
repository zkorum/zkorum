import {
  createSharedComposable,
  defaultWindow,
  useEventListener,
} from "@vueuse/core";
import { computed, onScopeDispose, shallowRef } from "vue";

export interface VisibleViewport {
  readonly top: number;
  readonly height: number;
  readonly bottom: number;
  readonly bottomInset: number;
  readonly scale: number;
}

function readViewport(): VisibleViewport {
  const layoutHeight =
    defaultWindow?.document.documentElement.clientHeight ||
    defaultWindow?.innerHeight ||
    0;
  const viewport = defaultWindow?.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? layoutHeight;
  const scale = viewport?.scale ?? 1;
  const bottom = top + height;

  return {
    top,
    height,
    bottom,
    // resizes-content already moves fixed elements. Only compensate for the
    // remaining occlusion, and don't mistake pinch zoom for a keyboard.
    bottomInset:
      Math.abs(scale - 1) < 0.01 ? Math.max(0, layoutHeight - bottom) : 0,
    scale,
  };
}

/** One set of viewport listeners, disposed when its last consumer unmounts. */
export const useVisibleViewport = createSharedComposable(() => {
  const viewport = shallowRef(readViewport());
  let frame: number | undefined;

  function update(): void {
    if (frame !== undefined || defaultWindow === undefined) return;
    frame = defaultWindow.requestAnimationFrame(() => {
      frame = undefined;
      const next = readViewport();
      const previous = viewport.value;
      if (
        next.top !== previous.top ||
        next.height !== previous.height ||
        next.bottomInset !== previous.bottomInset ||
        next.scale !== previous.scale
      )
        viewport.value = next;
    });
  }

  useEventListener(defaultWindow, "resize", update, { passive: true });
  useEventListener(
    defaultWindow?.visualViewport,
    ["resize", "scroll"],
    update,
    {
      passive: true,
    }
  );
  onScopeDispose(() => {
    if (frame !== undefined) defaultWindow?.cancelAnimationFrame(frame);
  });

  return {
    viewport: computed(() => viewport.value),
    viewportStyle: computed(() => ({
      "--visible-viewport-height": `${viewport.value.height}px`,
      "--visible-viewport-bottom-inset": `${viewport.value.bottomInset}px`,
    })),
  };
});
