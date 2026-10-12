<template>
  <div
    v-if="processEnv.VITE_TURNSTILE_SITE_KEY !== undefined"
    ref="container"
    class="turnstile-container"
  />
</template>

<script setup lang="ts">
import type { TurnstileAction } from "src/shared/types/turnstile";
import { loadTurnstile } from "src/utils/auth/turnstile";
import { processEnv } from "src/utils/processEnv";
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{ action: TurnstileAction }>();
const emit = defineEmits<{ tokenReady: [] }>();
const container = ref<HTMLElement>();
const token = ref<string>();
let widget: Awaited<ReturnType<typeof loadTurnstile>> | undefined;
let widgetId: string | undefined;
let mounted = true;

onMounted(async () => {
  const sitekey = processEnv.VITE_TURNSTILE_SITE_KEY;
  if (sitekey === undefined) return;
  try {
    const loaded = await loadTurnstile();
    if (!mounted || container.value === undefined) return;
    widget = loaded;
    widgetId = loaded.render(container.value, {
      sitekey,
      action: props.action,
      appearance: "interaction-only",
      size: "flexible",
      callback: (value) => {
        token.value = value;
        emit("tokenReady");
      },
      "expired-callback": () => {
        token.value = undefined;
      },
      "error-callback": () => {
        token.value = undefined;
      },
    });
  } catch (error) {
    console.error("Failed to load security challenge", error);
  }
});

onUnmounted(() => {
  mounted = false;
  if (widget !== undefined && widgetId !== undefined) {
    widget.remove(widgetId);
  }
});

function takeToken(): string | undefined {
  const current = token.value;
  token.value = undefined;
  if (current !== undefined && widget !== undefined && widgetId !== undefined) {
    widget.reset(widgetId);
  }
  return current;
}

const hasToken = computed(() => token.value !== undefined);
defineExpose({ takeToken, hasToken });
</script>

<style scoped lang="scss">
.turnstile-container {
  display: flex;
  justify-content: center;
}
</style>
