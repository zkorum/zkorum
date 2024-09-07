import { onMounted, ref } from "vue";

export function useViewPorts() {

  const visualViewPortHeight = ref(0);

  onMounted(() => {
    updateHeight();
    window.visualViewport?.addEventListener("resize", updateHeight);
  })

  function updateHeight() {
    const windowPort = window.visualViewport;
    if (windowPort != null) {
      const newHeight = windowPort.height;
      visualViewPortHeight.value = newHeight;
    }
  }

  return { visualViewPortHeight }

}