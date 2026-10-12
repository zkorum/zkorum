<template>
  <NewConversationLayout v-slot="{ isActive }">
    <Teleport v-if="isActive && !isNavigatingAway" to="#page-header">
      <DefaultMenuBar :click-to-scroll-top="false">
        <template #left>
          <BackButton
            :fallback-route="{ name: '/conversation/new/create/' }"
            @click="handleBack"
          />
        </template>
        <template #right>
          <PrimeButton
            :label="submitButtonLabel"
            :loading="isSubmitButtonLoading"
            class="next-button"
            @click="onSubmit()"
          />
        </template>
      </DefaultMenuBar>
    </Teleport>

    <div class="container">
      <!-- Title with Privacy Label -->
      <ConversationTitle
        :is-private="conversationDraft.isPrivate"
        :title="conversationDraft.title"
        size="large"
        :conversation-type-config="conversationDraft"
        :external-source-config="conversationDraft.externalSourceConfig"
        :project-context="undefined"
        project-context-title-mode="original"
      />

      <!-- GitHub-linked: show read-only preview (items will sync from GitHub) -->
      <div
        v-if="conversationDraft.externalSourceConfig !== null"
        class="seed-opinions-section"
      >
        <div class="section-title">{{ t("githubSyncTitle") }}</div>
        <p class="section-description">
          {{ t("githubSyncDescription") }}
        </p>
        <div v-if="isLoadingPreview" class="preview-loading">
          <q-spinner size="1.5rem" />
          <span>{{ t("loadingGithubPreview") }}</span>
        </div>
        <ErrorRetryBlock
          v-else-if="previewError"
          compact
          :title="t('githubPreviewError')"
          :retry-label="t('githubPreviewRetry')"
          @retry="retryPreview"
        />
        <div v-else-if="githubPreviewItems.length > 0" class="opinions-list">
          <div
            v-for="item in githubPreviewItems"
            :key="item.number"
            class="github-preview-item"
          >
            <span class="preview-item-title">{{ item.title }}</span>
            <a
              :href="item.htmlUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="preview-item-link"
              @click.stop
            >
              <q-icon name="mdi-open-in-new" size="0.875rem" />
            </a>
          </div>
        </div>
        <div v-else class="preview-empty">
          {{ t("noGithubIssuesFound") }}
        </div>
      </div>

      <!-- Manual: Add Seed Opinions Section -->
      <div v-else class="seed-opinions-section">
        <div class="section-title">
          {{ isMaxDiffDraft ? t("addMaxDiffItems") : t("addSeedOpinions") }}
        </div>
        <p class="section-description">
          {{
            isMaxDiffDraft
              ? t("maxDiffSeedDescription")
              : t("seedOpinionsDescription")
          }}
        </p>
        <SeedOpinionListEditor
          ref="seedEditor"
          v-model="conversationDraft.seedOpinions"
          :existing-opinions="[]"
          :disabled="isSubmitButtonLoading"
        />
        <SeedSuggestionsBox
          v-if="isSuggestionsBoxVisible && !isNavigatingAway"
          :suggestions="pendingSuggestions"
          :guidance="clarificationGuidance"
          :disabled="isSubmitButtonLoading || isNavigatingAway"
          :can-add-suggestion="canAddSuggestion"
          :can-generate="canRequestSuggestions"
          :is-generating="isGeneratingSuggestions"
          :generate-more-label="generateMoreLabel"
          @add="addSuggestion"
          @discard="discardSuggestion"
          @generate-more="generateSuggestions"
          @edit-conversation="handleBack"
        />
        <ConversationControlButton
          v-if="
            isAiSuggestionsEnabled &&
            !isSuggestionsBoxVisible &&
            !isSubmitButtonLoading
          "
          :label="aiSuggestionsButtonLabel"
          icon="pi pi-lightbulb"
          :show-border="false"
          icon-position="left"
          :disabled="!canRequestSuggestions"
          :aria-busy="isGeneratingSuggestions"
          @click="generateSuggestions"
        />
        <TurnstileChallenge
          v-if="isAiSuggestionsEnabled && !isSubmitButtonLoading"
          ref="suggestionChallenge"
          :action="SEED_SUGGESTIONS_TURNSTILE_ACTION"
        />
      </div>
    </div>

    <NewConversationRouteGuard
      ref="routeGuard"
      :allowed-routes="[
        '/conversation/new/create/',
        '/conversation/new/survey/',
        '/welcome/',
      ]"
      :has-unsaved-changes="isDraftModified"
      :reset-draft="resetDraft"
    />

    <PreParticipationIntentionDialog
      v-model="showLoginDialog"
      :ok-callback="onLoginCallback"
      active-intention="newConversation"
    />
  </NewConversationLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import PreParticipationIntentionDialog from "src/components/authentication/intention/PreParticipationIntentionDialog.vue";
import ConversationTitle from "src/components/features/conversation/ConversationTitle.vue";
import BackButton from "src/components/navigation/buttons/BackButton.vue";
import DefaultMenuBar from "src/components/navigation/header/DefaultMenuBar.vue";
import ConversationControlButton from "src/components/newConversation/ConversationControlButton.vue";
import NewConversationLayout from "src/components/newConversation/NewConversationLayout.vue";
import NewConversationRouteGuard from "src/components/newConversation/NewConversationRouteGuard.vue";
import SeedOpinionListEditor from "src/components/newConversation/SeedOpinionListEditor.vue";
import {
  type SeedOpinionsTranslations,
  seedOpinionsTranslations,
} from "src/components/newConversation/SeedOpinions.i18n";
import SeedSuggestionsBox from "src/components/newConversation/SeedSuggestionsBox.vue";
import ErrorRetryBlock from "src/components/ui/ErrorRetryBlock.vue";
import TurnstileChallenge from "src/components/verification/TurnstileChallenge.vue";
import { useConversationDraft } from "src/composables/conversation/draft";
import { useCreateSurveyAccess } from "src/composables/conversation/useCreateSurveyAccess";
import type { SeedOpinionCreateFailure } from "src/composables/conversation/usePublishConversationDraft";
import { usePublishConversationDraft } from "src/composables/conversation/usePublishConversationDraft";
import { useSeedSuggestions } from "src/composables/conversation/useSeedSuggestions";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { validateRichTextInput } from "src/shared/richText";
import { SEED_SUGGESTIONS_TURNSTILE_ACTION } from "src/shared/types/turnstile";
import { useAuthenticationStore } from "src/stores/authentication";
import { useLoginIntentionStore } from "src/stores/loginIntention";
import { useNewPostDraftsStore } from "src/stores/newConversationDrafts";
import { useMaxDiffApi } from "src/utils/api/maxdiff/maxdiff";
import {
  isHistoryBackToPath,
  navigateBackOrReplace,
} from "src/utils/nav/historyBack";
import { processEnv } from "src/utils/processEnv";
import { useNotify } from "src/utils/ui/notify";
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

defineOptions({
  components: {
    PrimeButton: Button,
  },
});

const { isLoggedIn } = storeToRefs(useAuthenticationStore());
const router = useRouter();
const { showNotifyMessage } = useNotify();

// Use composable for validation and draft management (with syncToStore: true since we're in create flow)
const { validateForReview, isDraftModified, resetDraft } = useConversationDraft(
  { syncToStore: true }
);
const { conversationDraft } = storeToRefs(useNewPostDraftsStore());
const isMaxDiffDraft = computed(
  () =>
    conversationDraft.value.conversationType === "ranking" &&
    conversationDraft.value.rankingMode === "bws"
);

const { previewGitHubIssues } = useMaxDiffApi();
const { publishConversationDraft } = usePublishConversationDraft();
const showLoginDialog = ref(false);
const isSubmitButtonLoading = ref(false);
const isNavigatingAway = ref(false);
const suggestionChallenge = ref<InstanceType<typeof TurnstileChallenge>>();

const isAiSuggestionsEnabled =
  processEnv.VITE_AI_SUGGESTIONS_ENABLED === "true";
const {
  pendingSuggestions,
  clarificationGuidance,
  isGenerating: isGeneratingSuggestions,
  canGenerate: canGenerateSuggestions,
  canAddSuggestion,
  generate,
  add: addSuggestionToStatements,
  discard: discardSuggestion,
} = useSeedSuggestions({
  conversationDraft,
  disabled: computed(
    () => isSubmitButtonLoading.value || isNavigatingAway.value
  ),
});
const canRequestSuggestions = computed(
  () =>
    canGenerateSuggestions.value &&
    (processEnv.VITE_TURNSTILE_SITE_KEY === undefined ||
      suggestionChallenge.value?.hasToken === true)
);
const isSuggestionsBoxVisible = computed(
  () =>
    pendingSuggestions.value.length > 0 ||
    clarificationGuidance.value !== undefined
);

const seedEditor = ref<InstanceType<typeof SeedOpinionListEditor>>();
const routeGuard = ref<{ unlockRoute: () => void } | undefined>(undefined);

async function handleBack(event: MouseEvent): Promise<void> {
  event.preventDefault();
  if (isSubmitButtonLoading.value) return;
  isNavigatingAway.value = true;

  const fallbackRoute = { name: "/conversation/new/create/" } as const;
  await navigateBackOrReplace({
    router,
    fallbackRoute,
    shouldNavigateBack: isHistoryBackToPath({
      historyBack: window.history.state?.back,
      expectedPath: "/conversation/new/create/",
    }),
  });
}

// GitHub preview state
interface GitHubPreviewItem {
  number: number;
  title: string;
  htmlUrl: string;
}
const isLoadingPreview = ref(false);
const previewError = ref(false);
const githubPreviewItems = ref<GitHubPreviewItem[]>([]);

const { createNewConversationIntention } = useLoginIntentionStore();
const { t } = useComponentI18n<SeedOpinionsTranslations>(
  seedOpinionsTranslations
);
const { isSurveyCreationAllowed, refreshSurveyCreationAccess } =
  useCreateSurveyAccess();
const submitButtonLabel = computed(() => {
  return isSurveyCreationAllowed.value === true
    ? t("nextButton")
    : t("publishButton");
});

const aiSuggestionsButtonLabel = computed(() =>
  isGeneratingSuggestions.value
    ? t("aiSuggestionsGenerating")
    : t("aiSuggestionsButton")
);
const generateMoreLabel = computed(() =>
  isGeneratingSuggestions.value
    ? t("aiSuggestionsGenerating")
    : t("aiSuggestionsGenerateMore")
);

async function generateSuggestions(): Promise<void> {
  if (!canRequestSuggestions.value) return;
  if (!isLoggedIn.value) {
    showLoginDialog.value = true;
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

function addSuggestion(suggestionId: string): void {
  if (!isSubmitButtonLoading.value) addSuggestionToStatements(suggestionId);
}

onMounted(async () => {
  await nextTick();

  const validation = validateForReview();

  if (!validation.isValid) {
    isNavigatingAway.value = true;
    await router.replace({ name: "/conversation/new/create/" });
    return;
  }

  await refreshSurveyCreationAccess();

  // Fetch GitHub preview if this is a GitHub-linked conversation
  if (conversationDraft.value.externalSourceConfig !== null) {
    await fetchGitHubPreview();
  }
});

function onLoginCallback() {
  createNewConversationIntention();
}

async function fetchGitHubPreview(): Promise<void> {
  const config = conversationDraft.value.externalSourceConfig;
  if (config === null) return;

  isLoadingPreview.value = true;
  previewError.value = false;
  githubPreviewItems.value = [];

  const response = await previewGitHubIssues({
    repository: config.repository,
    label: config.label,
  });

  if (response.status === "success") {
    githubPreviewItems.value = response.data.issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      htmlUrl: issue.htmlUrl,
    }));
  } else {
    previewError.value = true;
  }

  isLoadingPreview.value = false;
}

async function retryPreview(): Promise<void> {
  await fetchGitHubPreview();
}

function validateSeedOpinions(): boolean {
  // GitHub-linked conversations don't need manual seeds
  if (conversationDraft.value.externalSourceConfig !== null) {
    return true;
  }

  const validationResults = conversationDraft.value.seedOpinions.map((html) =>
    validateRichTextInput({ htmlString: html, mode: "opinion" })
  );
  const visibleOpinionCount = validationResults.filter(
    (result) => result.success || result.reason !== "plain_text_empty"
  ).length;

  if (isMaxDiffDraft.value && visibleOpinionCount < 2) {
    showNotifyMessage(t("needMinimumForMaxDiff"));
    return false;
  }

  return seedEditor.value?.validate() === true;
}

function showSeedOpinionFailure(failure: SeedOpinionCreateFailure): void {
  seedEditor.value?.showFailure(failure);
}

async function onSubmit() {
  if (isSubmitButtonLoading.value) {
    return;
  }

  if (!isLoggedIn.value) {
    showLoginDialog.value = true;
    return;
  }

  if (!validateSeedOpinions()) {
    return;
  }

  isSubmitButtonLoading.value = true;
  const canCreateSurvey = await refreshSurveyCreationAccess();

  if (canCreateSurvey) {
    routeGuard.value?.unlockRoute();
    isNavigatingAway.value = true;
    await nextTick();
    await router.push({
      name: "/conversation/new/survey/",
    });
    return;
  }

  const wasPublished = await publishConversationDraft({
    conversationDraft: conversationDraft.value,
    surveyConfig: null,
    invalidSurveyMessage: t("errorCreatingConversation"),
    defaultErrorMessage: t("errorCreatingConversation"),
    onSeedOpinionFailure: showSeedOpinionFailure,
    beforeSuccessNavigation: () => {
      routeGuard.value?.unlockRoute();
      isNavigatingAway.value = true;
    },
  });

  if (!wasPublished) {
    isSubmitButtonLoading.value = false;
  }
}
</script>

<style scoped lang="scss">
.container {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.next-button:focus-visible {
  outline: 3px solid rgba(107, 78, 255, 0.4);
  outline-offset: 3px;
}

.seed-opinions-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: var(--font-weight-medium);
  margin: 0;
  color: #333;
}

.section-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.opinions-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.preview-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: $color-text-weak;
  padding: 1rem 0;
}

.github-preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: $app-background-color;
  border-radius: 8px;
}

.preview-item-title {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: #333;
}

.preview-item-link {
  color: $color-text-weak;
  flex-shrink: 0;

  &:hover {
    color: $primary;
  }
}

.preview-empty {
  color: $color-text-weak;
  font-size: 0.9rem;
  padding: 1rem 0;
}
</style>
