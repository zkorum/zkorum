import { useElementSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useElementVisibility } from "src/composables/ui/useElementVisibility";
import { useLayoutHeaderStore } from "src/stores/layout/header";
import { useVisibleViewport } from "src/utils/html/viewPort";
import { computed, onActivated, onMounted, shallowRef } from "vue";

export function useOpinionComposerViewport({
  composer,
  actionBar,
  editingOpinionSlugId,
  enabled,
}: {
  composer: () => HTMLElement | null;
  actionBar: () => HTMLElement | undefined;
  editingOpinionSlugId: () => string | undefined;
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

  function findHeader(): void {
    const element = document.querySelector(".q-header");
    header.value = element instanceof HTMLElement ? element : undefined;
  }
  onMounted(findHeader);
  onActivated(findHeader);

  const { reveal } = useElementVisibility({
    target: () => {
      const slugId = editingOpinionSlugId();
      if (slugId === undefined) return undefined;
      const card = document.getElementById(`comment-${slugId}`);
      const content = card?.querySelector(".comment-content");
      return content instanceof HTMLElement ? content : card;
    },
    enabled: () => enabled() && editingOpinionSlugId() !== undefined,
    observe: () => [composer(), header.value, actionBar()],
    getBounds: () => ({
      top: viewport.value.top + topInset.value + 12,
      bottom:
        Math.min(
          viewport.value.bottom,
          composer()?.getBoundingClientRect().top ?? viewport.value.bottom
        ) - 12,
    }),
  });

  return {
    revealEditingOpinion: reveal,
    composerViewportStyle: computed(() => ({
      "--composer-available-height": `${Math.max(0, viewport.value.height - topInset.value)}px`,
    })),
  };
}
