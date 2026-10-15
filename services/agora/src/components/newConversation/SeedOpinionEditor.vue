<template>
  <div class="seed-opinion-editor">
    <SeedOpinionListEditor
      ref="editor"
      v-model="opinions"
      :existing-opinions="existingOpinions"
      :disabled="disabled"
    >
      <template #actions>
        <ConversationControlButton
          v-if="isAiSuggestionsEnabled && !isSuggestionsBoxVisible"
          :label="aiSuggestionsButtonLabel"
          icon="pi pi-sparkles"
          :show-border="false"
          icon-position="left"
          :disabled="!canRequestSuggestions"
          :aria-busy="isGenerating"
          @click="generateSuggestions"
        />
      </template>
    </SeedOpinionListEditor>
    <SeedSuggestionsBox
      v-if="isSuggestionsBoxVisible"
      :suggestions="pendingSuggestions"
      :guidance="clarificationGuidance"
      :disabled="disabled"
      :can-add-suggestion="canAddSuggestion"
      :can-generate="canRequestSuggestions"
      :is-generating="isGenerating"
      :generate-more-label="generateMoreLabel"
      :edit-conversation-route="editConversationRoute"
      @add="add"
      @discard="discard"
      @generate-more="generateSuggestions"
      @edit-conversation="emit('editConversation', $event)"
    />
    <TurnstileChallenge
      v-if="isAiSuggestionsEnabled && !disabled"
      ref="suggestionChallenge"
      :action="SEED_SUGGESTIONS_TURNSTILE_ACTION"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import TurnstileChallenge from "src/components/verification/TurnstileChallenge.vue";
import {
  type SeedSuggestionContext,
  useSeedSuggestions,
} from "src/composables/conversation/useSeedSuggestions";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { SeedOpinionValidationFailure } from "src/shared/types/dto";
import { SEED_SUGGESTIONS_TURNSTILE_ACTION } from "src/shared/types/turnstile";
import { useAuthenticationStore } from "src/stores/authentication";
import { processEnv } from "src/utils/processEnv";
import { useNotify } from "src/utils/ui/notify";
import { computed, ref, toRef, watch } from "vue";
import type { RouteLocationRaw } from "vue-router";

import ConversationControlButton from "./ConversationControlButton.vue";
import SeedOpinionListEditor from "./SeedOpinionListEditor.vue";
import { seedOpinionsTranslations } from "./SeedOpinions.i18n";
import SeedSuggestionsBox from "./SeedSuggestionsBox.vue";

const props = defineProps<{
  suggestionContext: SeedSuggestionContext;
  existingOpinions: readonly string[];
  disabled: boolean;
  editConversationRoute: RouteLocationRaw;
}>();
const emit = defineEmits<{
  loginRequired: [];
  editConversation: [event: MouseEvent];
}>();
const opinions = defineModel<string[]>({ required: true });
const editor = ref<InstanceType<typeof SeedOpinionListEditor>>();
const suggestionChallenge = ref<InstanceType<typeof TurnstileChallenge>>();
const { isLoggedIn, userId } = storeToRefs(useAuthenticationStore());
const { showNotifyMessage } = useNotify();
const { t } = useComponentI18n(seedOpinionsTranslations);
const isAiSuggestionsEnabled =
  processEnv.VITE_AI_SUGGESTIONS_ENABLED === "true";
const {
  pendingSuggestions,
  clarificationGuidance,
  isGenerating,
  canGenerate,
  canAddSuggestion,
  generate,
  add,
  discard,
  reset,
} = useSeedSuggestions({
  context: toRef(props, "suggestionContext"),
  opinions,
  existingOpinions: toRef(props, "existingOpinions"),
  disabled: computed(() => props.disabled),
});
watch([userId, isLoggedIn], reset, { flush: "sync" });
const canRequestSuggestions = computed(
  () =>
    canGenerate.value &&
    (processEnv.VITE_TURNSTILE_SITE_KEY === undefined ||
      suggestionChallenge.value?.hasToken === true)
);
const isSuggestionsBoxVisible = computed(
  () =>
    pendingSuggestions.value.length > 0 ||
    clarificationGuidance.value !== undefined
);
const aiSuggestionsButtonLabel = computed(() =>
  isGenerating.value
    ? t("aiSuggestionsGenerating")
    : t("aiGenerateSeedOpinions")
);
const generateMoreLabel = computed(() =>
  isGenerating.value
    ? t("aiSuggestionsGenerating")
    : t("aiSuggestionsGenerateMore")
);

async function generateSuggestions(): Promise<void> {
  if (!isAiSuggestionsEnabled || !canRequestSuggestions.value) return;
  if (!isLoggedIn.value) {
    emit("loginRequired");
    return;
  }
  const result = await generate(suggestionChallenge.value?.takeToken());
  if (result.status !== "error") return;
  switch (result.reason) {
    case "not_available":
      showNotifyMessage(t("aiSuggestionsNotAvailable"));
      break;
    case "rate_limited":
      showNotifyMessage(t("aiSuggestionsRateLimited"));
      break;
    case "failed":
      showNotifyMessage(t("aiSuggestionsFailed"));
      break;
  }
}

defineExpose({
  validate: () => editor.value?.validate() === true,
  showFailure: (failure: SeedOpinionValidationFailure) =>
    editor.value?.showFailure(failure),
});
</script>

<style scoped lang="scss">
.seed-opinion-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
