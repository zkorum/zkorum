<template>
  <div
    class="stepperLayout"
    :class="{
      'stepperLayout--compact': density === 'compact',
      'stepperLayout--fixedNavigation': fixedNavigation,
    }"
  >
    <div
      :key="currentStep"
      class="scrollContent"
      :tabindex="fixedNavigation ? 0 : undefined"
    >
      <OnboardStepper
        v-if="showStepper"
        :current-step="currentStep"
        :total-steps="totalSteps"
      />

      <slot name="header"></slot>

      <div class="bodyContent">
        <slot name="body"></slot>
      </div>
    </div>

    <div v-if="showNextButton" class="nextButton">
      <ZKButton
        button-type="standardButton"
        :icon="nextIcon"
        :aria-label="t('continue')"
        :color="enableNextButton ? 'primary' : 'button-background-color'"
        :text-color="enableNextButton ? 'white' : 'color-text-strong'"
        :disable="!enableNextButton || showLoadingButton"
        :loading="showLoadingButton"
        @click="submitCallBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import OnboardStepper from "src/components/onboarding/layouts/OnboardStepper.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { computed } from "vue";

import {
  type StepperLayoutTranslations,
  stepperLayoutTranslations,
} from "./StepperLayout.i18n";

withDefaults(
  defineProps<{
    submitCallBack: () => void;
    currentStep: number;
    totalSteps: number;
    enableNextButton: boolean;
    showNextButton: boolean;
    showLoadingButton: boolean;
    showStepper?: boolean;
    density?: "comfortable" | "compact";
    fixedNavigation?: boolean;
  }>(),
  {
    showStepper: true,
    density: "comfortable",
    fixedNavigation: false,
  }
);

const $q = useQuasar();
const { t } = useComponentI18n<StepperLayoutTranslations>(
  stepperLayoutTranslations
);
const nextIcon = computed(() =>
  $q.lang.rtl ? "mdi-arrow-left" : "mdi-arrow-right"
);
</script>

<style scoped lang="scss">
.stepperLayout {
  --stepper-content-gap: 2rem;

  background-color: white;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  gap: var(--stepper-content-gap);
  padding: 1rem;
  padding-bottom: 5rem;
}

.stepperLayout--compact {
  --stepper-content-gap: 0.875rem;

  padding-bottom: 3rem;
}

.scrollContent {
  display: flex;
  flex-direction: column;
  gap: var(--stepper-content-gap);
}

.stepperLayout--fixedNavigation {
  flex: 1;
  min-width: 0;
  min-height: 0;
  gap: 0;
  padding: 0;

  .scrollContent {
    flex: 1;
    min-height: 0;
    padding: 1rem;
    overflow-y: auto;
    overscroll-behavior-y: contain;
  }

  .nextButton {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid $secondary;
    background-color: white;
  }
}

.bodyContent {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nextButton {
  display: flex;
  justify-content: flex-end;
}
</style>
