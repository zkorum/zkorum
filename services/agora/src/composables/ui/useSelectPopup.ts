import "src/css/selectPopup.scss";

import { createSharedComposable } from "@vueuse/core";
import type { QSelectProps } from "quasar";
import { useVisibleViewport } from "src/utils/html/viewPort";
import { computed } from "vue";

/** Bound the options in both Quasar's mobile dialog and desktop menu. */
export const useSelectPopup = createSharedComposable(() => {
  const { viewport } = useVisibleViewport();
  const maxHeight = computed(() => `${viewport.value.height * 0.45}px`);

  return computed(
    () =>
      ({
        popupContentClass: "zk-select-popup",
        // Quasar's object-style type omits CSS custom properties.
        popupContentStyle: `--zk-select-popup-max-height: ${maxHeight.value}`,
      }) satisfies Pick<QSelectProps, "popupContentClass" | "popupContentStyle">
  );
});
