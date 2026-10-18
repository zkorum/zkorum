<template>
  <section class="conversation-onboarding-step">
    <div class="step-navigation">
      <q-btn
        flat
        round
        dense
        :icon="backIcon"
        :aria-label="t('goBack')"
        @click="backCallback"
      />
      <q-btn
        flat
        round
        dense
        icon="mdi-close"
        :aria-label="t('close')"
        @click="sheet.dismiss"
      />
    </div>
    <div class="step-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { DismissalController } from "src/utils/ui/dismissalController";
import { computed, watch } from "vue";

import {
  type OnboardingLayoutTranslations,
  onboardingLayoutTranslations,
} from "./OnboardingLayout.i18n";

const props = defineProps<{
  sheet: DismissalController;
  backCallback: () => void;
  closeCallback: () => Promise<void>;
}>();

watch(
  () => ({ sheet: props.sheet, close: props.closeCallback }),
  ({ sheet, close }, _previous, onCleanup) => {
    onCleanup(sheet.registerDismiss(close));
  },
  { immediate: true }
);
const $q = useQuasar();
const backIcon = computed(() =>
  $q.lang.rtl ? "mdi-arrow-right" : "mdi-arrow-left"
);
const { t } = useComponentI18n<OnboardingLayoutTranslations>(
  onboardingLayoutTranslations
);
</script>

<style scoped lang="scss">
.conversation-onboarding-step,
.step-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.step-navigation {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding-inline: 1rem;
}

.step-content {
  :deep(.stepperLayout--fixedNavigation .nextButton) {
    margin-block-start: auto;
  }

  > :deep(form) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
}
</style>
