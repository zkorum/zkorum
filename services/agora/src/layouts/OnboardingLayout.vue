<template>
  <div>
    <q-layout view="hHh lpR fFf">
      <q-page-container>
        <div
          class="backgroundContainer"
          :style="{
            backgroundImage: 'url(/images/onboarding/background.webp)',
          }"
        >
          <q-page>
            <div
              class="baseLayer"
              :class="{
                'baseLayer--bodyBehindFooter': bodyBehindFooter,
                'baseLayer--fixedNavigation': fixedNavigation,
              }"
            >
              <button
                v-if="showBackButton"
                class="backButton"
                :aria-label="t('goBack')"
                @click="handleBack"
              >
                <q-icon name="mdi-arrow-left" size="1.2rem" />
              </button>
              <button
                v-if="showCloseButton"
                class="closeButton"
                :aria-label="t('close')"
                @click="handleClose"
              >
                <q-icon name="mdi-close" size="1.2rem" />
              </button>
              <div class="containerPaddings">
                <slot name="body" />
              </div>
              <div
                class="topLayer"
                :class="{
                  'topLayer--overBody': bodyBehindFooter,
                }"
              >
                <div class="widthLimiter">
                  <slot name="footer" />
                </div>
              </div>
            </div>
          </q-page>
        </div>
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup lang="ts">
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { useRouter } from "vue-router";

import {
  type OnboardingLayoutTranslations,
  onboardingLayoutTranslations,
} from "./OnboardingLayout.i18n";

const props = withDefaults(
  defineProps<{
    showBackButton?: boolean;
    backCallback?: () => void;
    showCloseButton?: boolean;
    closeCallback?: () => void;
    bodyBehindFooter?: boolean;
    fixedNavigation?: boolean;
  }>(),
  {
    showBackButton: true,
    backCallback: undefined,
    showCloseButton: false,
    closeCallback: undefined,
    bodyBehindFooter: false,
    fixedNavigation: false,
  }
);

const router = useRouter();
const { t } = useComponentI18n<OnboardingLayoutTranslations>(
  onboardingLayoutTranslations
);

function handleBack() {
  if (props.backCallback) {
    props.backCallback();
  } else {
    router.back();
  }
}

function handleClose() {
  if (props.closeCallback) {
    props.closeCallback();
  } else {
    router.back();
  }
}
</script>

<style scoped lang="scss">
.backgroundContainer {
  background-size: cover;
}

.baseLayer {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.baseLayer--bodyBehindFooter {
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

.baseLayer--fixedNavigation {
  height: 100dvh;
  min-height: 0;
  overflow: hidden;

  .containerPaddings {
    flex: 0 1 auto;
    min-height: 0;
    overflow: clip;
  }

  .topLayer {
    // Reserve navigation space even when the banner needs to shrink.
    flex: 1 0 calc(5rem + env(safe-area-inset-bottom, 0px));
    min-height: 0;
    margin-top: 0;
    align-items: stretch;
    overflow: hidden;
  }

  .widthLimiter {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

.backButton {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.7);
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  &:active {
    background-color: rgba(255, 255, 255, 1);
  }
}

.closeButton {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.7);
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  &:active {
    background-color: rgba(255, 255, 255, 1);
  }
}

.topLayer {
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: white;
  border-top: 1px solid $secondary;
  margin-top: auto;
}

.topLayer--overBody {
  position: absolute;
  bottom: 0;
  max-height: 70dvh;
  overflow: auto;
  scrollbar-width: none;
  margin-top: 0;
}

.containerPaddings {
  padding-left: 1rem;
  padding-right: 1rem;
}

.widthLimiter {
  width: min(calc(100vw - 1rem), 25rem);
}
</style>
