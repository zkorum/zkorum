<template>
  <section
    class="suggestions-box"
    :class="{ 'needs-clarification': guidance !== undefined }"
    :aria-label="t('aiSuggestionsButton')"
  >
    <div class="suggestions-header">
      <i class="pi pi-lightbulb suggestions-icon" aria-hidden="true" />
      <span class="suggestions-title">{{ t("aiSuggestionsButton") }}</span>
    </div>
    <p class="suggestions-note">
      {{
        guidance === undefined
          ? t("aiSuggestionsNote")
          : t("aiSuggestionsNotClear")
      }}
    </p>

    <div v-if="guidance !== undefined" class="suggestions-guidance">
      <p class="suggestions-guidance-text">{{ guidance }}</p>
    </div>

    <ul v-if="suggestions.length > 0" class="suggestions-list">
      <li
        v-for="suggestion in suggestions"
        :key="suggestion.suggestionId"
        class="suggestion-item"
      >
        <p class="suggestion-text">{{ suggestion.text }}</p>
        <div class="suggestion-actions">
          <PrimeButton
            :label="t('aiSuggestionAdd')"
            size="small"
            :disabled="disabled || !canAddSuggestion"
            @click="emit('add', suggestion.suggestionId)"
          />
          <PrimeButton
            :label="t('aiSuggestionDiscard')"
            size="small"
            text
            severity="secondary"
            :disabled="disabled"
            @click="emit('discard', suggestion.suggestionId)"
          />
        </div>
      </li>
    </ul>

    <div class="box-footer">
      <component
        :is="disabled ? 'span' : SpaLink"
        v-if="guidance !== undefined"
        :to="disabled ? undefined : editConversationRoute"
        :deferred="disabled ? undefined : true"
        :aria-disabled="disabled"
        :class="{ 'is-disabled': disabled }"
        class="edit-conversation-link"
        @click="editConversation"
      >
        <ZKIcon
          :name="backIcon"
          size="1.1rem"
          color="currentColor"
          aria-hidden="true"
        />
        {{ t("aiSuggestionsEditConversation") }}
      </component>
      <PrimeButton
        v-else
        :label="generateMoreLabel"
        size="small"
        :disabled="disabled || !canGenerate"
        :aria-busy="isGenerating"
        @click="emit('generateMore')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { useQuasar } from "quasar";
import SpaLink from "src/components/ui-library/SpaLink.vue";
import ZKIcon from "src/components/ui-library/ZKIcon.vue";
import type { SeedSuggestionItem } from "src/composables/conversation/useSeedSuggestions";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";

import { seedOpinionsTranslations } from "./SeedOpinions.i18n";

defineOptions({
  components: {
    PrimeButton: Button,
  },
});

const props = defineProps<{
  suggestions: readonly SeedSuggestionItem[];
  guidance: string | undefined;
  disabled: boolean;
  canAddSuggestion: boolean;
  canGenerate: boolean;
  isGenerating: boolean;
  generateMoreLabel: string;
  editConversationRoute: RouteLocationRaw;
}>();

const emit = defineEmits<{
  add: [suggestionId: string];
  discard: [suggestionId: string];
  generateMore: [];
  editConversation: [event: MouseEvent];
}>();

const { t } = useComponentI18n(seedOpinionsTranslations);

function editConversation(event: MouseEvent): void {
  if (
    props.disabled ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  emit("editConversation", event);
}

const $q = useQuasar();
const backIcon = computed(() =>
  $q.lang.rtl ? "ci:chevron-right" : "ci:chevron-left"
);
</script>

<style scoped lang="scss">
.suggestions-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid $primary-lighter;
  border-radius: 20px;
  background-color: $primary-lightest;
  --suggestions-accent: #{$primary-dark};

  &.needs-clarification {
    border-color: rgba($negative, 0.3);
    background-color: rgba($negative, 0.08);
    --suggestions-accent: #{$negative};
  }
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--suggestions-accent);
}

.suggestions-icon {
  font-size: 1.1rem;
}

.suggestions-title {
  font-size: 1rem;
  font-weight: var(--font-weight-medium);
}

.suggestions-note {
  margin: 0;
  color: $color-text-weak;
  font-size: 0.85rem;
  line-height: 1.4;
}

.suggestions-guidance,
.suggestion-item {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background-color: $color-background-default;
}

.suggestions-guidance-text,
.suggestion-text {
  margin: 0;
  color: $color-text-strong;
  font-size: 0.95rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.box-footer {
  display: flex;
  justify-content: flex-end;
}

.edit-conversation-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid $negative;
  border-radius: 8px;
  color: $negative;
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  text-decoration: none;

  &:hover:not(.is-disabled) {
    background-color: rgba($negative, 0.08);
  }

  &.is-disabled {
    opacity: 0.6;
    cursor: default;
  }
}
</style>
