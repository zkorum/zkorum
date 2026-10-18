<template>
  <div class="hero" :class="{ 'hero--compact': density === 'compact' }">
    <div class="hero__content">
      <div v-if="showOwnerImage" class="hero__avatar">
        <DynamicProfileImage
          :user-identity="ownerIdentity"
          :organization-image-url="organizationImageUrl || undefined"
          :size="density === 'compact' ? 40 : 64"
        />
      </div>

      <UserMetadata
        v-if="ownerIdentity.length > 0"
        class="hero__owner"
        :show-is-guest="false"
        :user-identity="ownerIdentity"
        :author-verified="false"
        :show-verified-text="false"
      />

      <div class="hero__title" :title="conversationTitle">
        {{ conversationTitle }}
      </div>

      <ContentTranslationControl
        v-if="contentTranslation?.isAvailable === true"
        :model-value="contentTranslation.mode"
        :source-language-label="contentTranslation.sourceLanguageLabel"
        :translation-status="contentTranslation.translationStatus"
        class="hero__translation-control"
        @update:model-value="emit('update:contentTranslationMode', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DynamicProfileImage from "src/components/account/DynamicProfileImage.vue";
import UserMetadata from "src/components/features/user/UserMetadata.vue";
import ContentTranslationControl from "src/components/translation/ContentTranslationControl.vue";
import type { LocalizedContentTranslationStatus } from "src/shared/types/zod";
import type { ContentTranslationDisplayMode } from "src/utils/translation/contentTranslation";
import { computed } from "vue";

interface HeroContentTranslationPreview {
  isAvailable: boolean;
  mode: ContentTranslationDisplayMode;
  sourceLanguageLabel: string | undefined;
  translationStatus: LocalizedContentTranslationStatus;
}

const props = defineProps<{
  conversationTitle: string;
  authorUsername: string;
  organizationName: string;
  organizationImageUrl: string;
  contentTranslation: HeroContentTranslationPreview | undefined;
  density: "comfortable" | "compact";
}>();

const emit = defineEmits<{
  "update:contentTranslationMode": [mode: ContentTranslationDisplayMode];
}>();

const ownerIdentity = computed(() => {
  return props.organizationName || props.authorUsername;
});

const showOwnerImage = computed(() => {
  return (
    props.organizationName.length === 0 || props.organizationImageUrl.length > 0
  );
});
</script>

<style scoped lang="scss">
.hero {
  min-height: clamp(13rem, 28dvh, 18rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: clamp(1rem, 3dvh, 2rem);
  padding-bottom: clamp(1.5rem, 4dvh, 3rem);
}

.hero__content {
  width: min(100%, 32rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.hero__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(4.5rem, 16vw, 5.5rem);
  height: clamp(4.5rem, 16vw, 5.5rem);
  padding: clamp(0.5rem, 2vw, 0.75rem);
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.hero__owner {
  justify-content: center;
  max-width: 100%;
}

.hero__title {
  max-width: 100%;
  font-size: clamp(1.35rem, 1.1rem + 1.2vw, 1.75rem);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  color: $ink-darkest;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.hero__translation-control {
  justify-content: center;
}

@media (max-width: 600px) {
  .hero {
    min-height: clamp(11rem, 24dvh, 15rem);
  }
}

.hero--compact {
  min-height: 0;
  padding-block: clamp(0.75rem, calc(4dvh - 0.5rem), 2.5rem);
  padding-inline: 2.5rem;

  .hero__content {
    gap: clamp(0.5rem, 1.5dvh, 1rem);
  }

  .hero__avatar {
    width: 3.5rem;
    height: 3.5rem;
    padding: 0.5rem;
  }

  .hero__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    font-size: 1.35rem;
  }
}

@media (max-height: 500px) {
  .hero--compact {
    padding-block: 0.5rem;
  }

  .hero--compact .hero__content {
    gap: 0.25rem;
  }

  .hero--compact .hero__avatar {
    display: none;
  }

  .hero--compact .hero__title {
    -webkit-line-clamp: 2;
    font-size: 1.1rem;
  }
}
</style>
