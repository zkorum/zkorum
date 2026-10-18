import { useElementSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useElementVisibility } from "src/composables/ui/useElementVisibility";
import { useLayoutHeaderStore } from "src/stores/layout/header";
import type { VerticalVisibleBounds } from "src/utils/html/elementVisibility";
import { useVisibleViewport } from "src/utils/html/viewPort";
import { computed, onActivated, onMounted, shallowRef } from "vue";

import type { OpinionSourceElements } from "./types";

export function getOpinionRevealTarget({
  sourceElements,
  bounds,
}: {
  sourceElements: OpinionSourceElements;
  bounds: VerticalVisibleBounds;
}): HTMLElement {
  return sourceElements.card.getBoundingClientRect().height <=
    bounds.bottom - bounds.top
    ? sourceElements.card
    : sourceElements.content;
}

export function useOpinionComposerViewport({
  composer,
  actionBar,
  sourceElements,
  enabled,
}: {
  composer: () => HTMLElement | null;
  actionBar: () => HTMLElement | undefined;
  sourceElements: () => OpinionSourceElements | undefined;
  enabled: () => boolean;
}) {
  const { viewport } = useVisibleViewport();
  const header = shallowRef<HTMLElement>();
  const { reveal: headerRevealed } = storeToRefs(useLayoutHeaderStore());
  const { height: headerHeight } = useElementSize(header, undefined, {
    box: "border-box",
  });
  const { height: actionBarHeight } = useElementSize(actionBar, undefined, {
    box: "border-box",
  });
  const topInset = computed(
    () =>
      (headerRevealed.value ? headerHeight.value : 0) + actionBarHeight.value
  );
  const availableHeight = computed(() =>
    Math.max(0, viewport.value.height - topInset.value)
  );
  const opinionCard = computed(() => sourceElements()?.card);
  const { height: cardHeight } = useElementSize(opinionCard, undefined, {
    box: "border-box",
  });

  function findHeader(): void {
    const element = document.querySelector(".q-header");
    header.value = element instanceof HTMLElement ? element : undefined;
  }
  onMounted(findHeader);
  onActivated(findHeader);

  function getBounds(): VerticalVisibleBounds {
    return {
      top: viewport.value.top + topInset.value + 12,
      bottom:
        Math.min(
          viewport.value.bottom,
          composer()?.getBoundingClientRect().top ?? viewport.value.bottom
        ) - 12,
    };
  }

  const { reveal } = useElementVisibility({
    target: () => {
      const elements = sourceElements();
      return elements === undefined
        ? undefined
        : getOpinionRevealTarget({
            sourceElements: elements,
            bounds: getBounds(),
          });
    },
    enabled: () => enabled() && sourceElements() !== undefined,
    observe: () => [composer(), header.value, actionBar()],
    getBounds,
  });

  return {
    revealEditingOpinion: reveal,
    composerViewportStyle: computed(() => ({
      "--composer-available-height": `${availableHeight.value}px`,
      // Reserve the short card and its gap; cap long-card context at half the
      // usable height so the editor remains usable on short screens.
      "--composer-context-height": `max(6rem, ${Math.min(cardHeight.value, availableHeight.value / 2) + 24}px)`,
    })),
  };
}
