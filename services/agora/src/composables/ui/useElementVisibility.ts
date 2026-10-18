import { useEventListener, useResizeObserver } from "@vueuse/core";
import {
  revealElement,
  type VerticalVisibleBounds,
} from "src/utils/html/elementVisibility";
import { useVisibleViewport } from "src/utils/html/viewPort";
import {
  computed,
  onActivated,
  onDeactivated,
  onMounted,
  onScopeDispose,
  shallowRef,
  watch,
} from "vue";

/** Reveal after focus/layout changes without taking focus from the user. */
export function useElementVisibility({
  target,
  enabled,
  getBounds,
  observe = () => [],
}: {
  target: () => HTMLElement | null | undefined;
  enabled: () => boolean;
  getBounds?: () => VerticalVisibleBounds;
  observe?: () => readonly (HTMLElement | null | undefined)[];
}) {
  const { viewport } = useVisibleViewport();
  const active = shallowRef(false);
  const manualRevealPending = shallowRef(false);
  const userHasScrolled = shallowRef(false);
  let frame: number | undefined;
  const normalScale = computed(() => Math.abs(viewport.value.scale - 1) < 0.01);
  const automaticTarget = computed(() =>
    active.value && enabled() && !userHasScrolled.value && normalScale.value
      ? (target() ?? undefined)
      : undefined
  );
  const observedElements = computed(() =>
    automaticTarget.value === undefined
      ? []
      : [automaticTarget.value, ...observe()]
  );

  function cancel(): void {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    manualRevealPending.value = false;
  }

  function canCorrect(): boolean {
    return (
      active.value &&
      !userHasScrolled.value &&
      (enabled() || manualRevealPending.value) &&
      normalScale.value
    );
  }

  function correct(): void {
    if (!canCorrect()) return;
    const element = target();
    if (!element?.isConnected) return;
    const bounds = getBounds?.() ?? {
      top: viewport.value.top + 12,
      bottom: viewport.value.bottom - 12,
    };
    revealElement({ element, bounds });
  }

  function refresh(): void {
    if (!canCorrect() || frame !== undefined) return;
    // Let route scroll restoration and Vue/layout updates finish before
    // measuring; check again after the browser applies the first correction.
    frame = requestAnimationFrame(() => {
      correct();
      frame = requestAnimationFrame(() => {
        frame = undefined;
        correct();
        manualRevealPending.value = false;
      });
    });
  }

  function reveal(): void {
    if (!active.value || !normalScale.value) return;
    userHasScrolled.value = false;
    manualRevealPending.value = true;
    refresh();
  }

  function stopForUserScroll(): void {
    userHasScrolled.value = true;
    cancel();
  }

  useEventListener(
    () =>
      active.value &&
      normalScale.value &&
      !userHasScrolled.value &&
      (enabled() || manualRevealPending.value)
        ? window
        : undefined,
    ["touchmove", "wheel"],
    stopForUserScroll,
    {
      passive: true,
      capture: true,
    }
  );
  watch(
    enabled,
    (shouldReveal) => {
      if (shouldReveal) reveal();
      else cancel();
    },
    { flush: "post" }
  );
  watch(
    [
      viewport,
      automaticTarget,
      () => (automaticTarget.value === undefined ? undefined : getBounds?.()),
    ],
    () => {
      if (enabled()) refresh();
    },
    { flush: "post" }
  );
  useResizeObserver(observedElements, () => {
    if (enabled()) refresh();
  });

  function activate(): void {
    if (active.value) return;
    active.value = true;
    if (enabled()) reveal();
  }
  function deactivate(): void {
    active.value = false;
    cancel();
  }

  onMounted(activate);
  onActivated(activate);
  onDeactivated(deactivate);
  onScopeDispose(deactivate);

  return { reveal };
}
