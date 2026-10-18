<template>
  <EditConversationLayout
    ref="editLayout"
    :conversation-slug-id="conversationSlugId"
    :is-loading="!hasLoadedSurvey"
    :has-unsaved-changes="hasUnsavedChanges || editStore.hasUnsavedChanges"
    :navigation-pending="isSaving || isDeleting"
    :fallback-route="conversationReturnPath"
  >
    <template #actions>
      <PrimeButton
        :label="t('saveButton')"
        :loading="isSaving"
        :disabled="isSaveDisabled"
        @click="saveSurvey"
      />
    </template>

    <div class="container">
      <SurveyConfigEditor
        v-model:survey-config="surveyConfig"
        body-card
        :texts="surveyEditorTexts"
        :display-language="locale"
        :original-survey-config="originalSurveyConfig"
        :show-validation-errors="surveyValidationErrorMessage !== null"
        :read-only="!canEditSurvey"
        @clear-validation-error="clearSurveyValidationError"
      >
        <template #between-intro-and-editor>
          <ZKCard padding="1rem" class="summary-card">
            <div class="summary-card__title">{{ t("changeSummaryTitle") }}</div>
            <div v-if="hasAnySummaryChanges" class="summary-card__list">
              <div>
                {{
                  t("addedQuestions", {
                    count: changeSummary.addedQuestionCount,
                  })
                }}
              </div>
              <div>
                {{
                  t("removedQuestions", {
                    count: changeSummary.removedQuestionCount,
                  })
                }}
              </div>
              <div>
                {{
                  t("updatedQuestions", {
                    count: changeSummary.updatedQuestionCount,
                  })
                }}
              </div>
              <div>
                {{
                  t("addedOptions", { count: changeSummary.addedOptionCount })
                }}
              </div>
              <div>
                {{
                  t("removedOptions", {
                    count: changeSummary.removedOptionCount,
                  })
                }}
              </div>
              <div>
                {{
                  t("updatedOptions", {
                    count: changeSummary.updatedOptionCount,
                  })
                }}
              </div>
            </div>

            <div v-else class="summary-card__empty">
              {{ t("noChangesSummary") }}
            </div>
          </ZKCard>

          <SurveyCompletionCountsCard
            v-if="completionCountsQuery.data.value !== undefined"
            :has-survey="completionCountsQuery.data.value.hasSurvey"
            :counts="completionCountsQuery.data.value.counts"
          />
        </template>

        <template #actions>
          <q-btn
            v-if="originalSurveyConfig !== null"
            flat
            no-caps
            color="negative"
            :label="t('deleteButton')"
            :loading="isDeleting"
            :disable="!canDeleteSurvey"
            @click="requestDeleteSurvey"
          />
        </template>
      </SurveyConfigEditor>
    </div>

    <template #dialogs>
      <ZKConfirmDialog
        v-model="showDeleteDialog"
        :message="t('confirmDeleteMessage')"
        :actions="{
          cancel: {
            label: t('cancelLabel'),
            appearance: 'secondary-outlined',
          },
          confirm: { label: t('deleteButton'), appearance: 'danger' },
        }"
        @confirm="deleteSurvey"
      />
    </template>
  </EditConversationLayout>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import EditConversationLayout from "src/components/newConversation/EditConversationLayout.vue";
import SurveyCompletionCountsCard from "src/components/survey/SurveyCompletionCountsCard.vue";
import SurveyConfigEditor from "src/components/survey/SurveyConfigEditor.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import ZKConfirmDialog from "src/components/ui-library/ZKConfirmDialog.vue";
import {
  type EditConversationLoadFailure,
  useEditConversationLoader,
} from "src/composables/conversation/useEditConversationLoader";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { GetConversationForEditResponse } from "src/shared/types/dto";
import type { SurveyConfig } from "src/shared/types/zod";
import { useEditConversationStore } from "src/stores/editConversation";
import { useBackendPostEditApi } from "src/utils/api/post/postEdit";
import {
  useSurveyCompletionCountsQuery,
  useSurveyConfigDeleteMutation,
  useSurveyConfigUpdateMutation,
} from "src/utils/api/survey/useSurveyQueries";
import { getConversationEditReturnPath } from "src/utils/router/conversationEditReturn";
import { getSingleRouteParam } from "src/utils/router/params";
import {
  areSurveyConfigsEqual,
  buildSurveyConfigForSave,
  cloneSurveyConfig,
  summarizeSurveyConfigChanges,
} from "src/utils/survey/config";
import { useNotify } from "src/utils/ui/notify";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { editConversationTranslations } from "../index.i18n";
import {
  type EditSurveyTranslations,
  editSurveyTranslations,
} from "./index.i18n";

defineOptions({
  components: {
    PrimeButton: Button,
  },
});

const { t, locale } = useComponentI18n<EditSurveyTranslations>(
  editSurveyTranslations
);
const { showNotifyMessage } = useNotify();
const { t: editT } = useComponentI18n(editConversationTranslations);
const route = useRoute();
const router = useRouter();
const { getConversationForEdit } = useBackendPostEditApi();
const editStore = useEditConversationStore();

const conversationSlugId = computed(() =>
  getSingleRouteParam(route.params.conversationSlugId)
);
const editLayout = ref<InstanceType<typeof EditConversationLayout>>();
const isSaving = ref(false);
const isDeleting = ref(false);
const showDeleteDialog = ref(false);
const surveyConfig = ref<SurveyConfig | null>(null);
const originalSurveyConfig = ref<SurveyConfig | null>(null);
const surveyValidationErrorMessage = ref<string | null>(null);
type EditPermissions = Extract<
  GetConversationForEditResponse,
  { success: true }
>["editPermissions"];
const editPermissions = ref<EditPermissions | null>(null);
const canEditSurvey = computed(() => {
  return editPermissions.value?.canEditSurvey === true;
});
const canDeleteSurvey = computed(() => {
  return editPermissions.value?.canDeleteSurvey === true;
});
const { isLoading, conversationReturnPath } = useEditConversationLoader({
  conversationSlugId,
  getConversation: getConversationForEdit,
  onReset: () => {
    editPermissions.value = null;
    surveyConfig.value = null;
    originalSurveyConfig.value = null;
    surveyValidationErrorMessage.value = null;
    showDeleteDialog.value = false;
  },
  onLoaded: ({ conversation }) => {
    editPermissions.value = conversation.editPermissions;
    surveyConfig.value = cloneSurveyConfig({
      surveyConfig: conversation.surveyConfig ?? null,
    });
    originalSurveyConfig.value = cloneSurveyConfig({
      surveyConfig: conversation.surveyConfig ?? null,
    });
  },
  onReady: async () => {
    if (
      canEditSurvey.value ||
      (surveyConfig.value !== null && canDeleteSurvey.value)
    )
      return;
    await router.replace({
      name: "/conversation/[conversationSlugId]/edit/",
      params: { conversationSlugId: conversationSlugId.value },
      query: route.query,
    });
  },
  onError: async (failure) => {
    const messages = {
      not_found: editT("notFoundError"),
      not_author: editT("notAuthorError"),
      locked: editT("conversationLockedError"),
      load_failed: t("loadError"),
    } satisfies Record<EditConversationLoadFailure, string>;
    editLayout.value?.unlockRoute();
    editStore.clear();
    showNotifyMessage({ message: messages[failure], force: true });
    await router.replace(conversationReturnPath.value);
  },
});
const hasLoadedSurvey = computed(
  () =>
    !isLoading.value &&
    (canEditSurvey.value ||
      (surveyConfig.value !== null && canDeleteSurvey.value))
);

const completionCountsQuery = useSurveyCompletionCountsQuery({
  conversationSlugId,
  enabled: hasLoadedSurvey,
});
const updateSurveyConfigMutation = useSurveyConfigUpdateMutation({
  conversationSlugId,
});
const deleteSurveyConfigMutation = useSurveyConfigDeleteMutation({
  conversationSlugId,
});
const hasUnsavedChanges = computed(() => {
  return !areSurveyConfigsEqual({
    left: originalSurveyConfig.value,
    right: surveyConfig.value,
  });
});
const isSaveDisabled = computed(() => {
  return (
    isLoading.value ||
    isSaving.value ||
    isDeleting.value ||
    !canEditSurvey.value ||
    !hasUnsavedChanges.value
  );
});
const changeSummary = computed(() => {
  return summarizeSurveyConfigChanges({
    previousSurveyConfig: originalSurveyConfig.value,
    nextSurveyConfig: surveyConfig.value,
  });
});
const hasAnySummaryChanges = computed(() => {
  return (
    changeSummary.value.addedQuestionCount > 0 ||
    changeSummary.value.removedQuestionCount > 0 ||
    changeSummary.value.updatedQuestionCount > 0 ||
    changeSummary.value.addedOptionCount > 0 ||
    changeSummary.value.removedOptionCount > 0 ||
    changeSummary.value.updatedOptionCount > 0
  );
});
const surveyEditorTexts = computed(() => ({
  title: t("title"),
  description: t("description"),
  requiredSurveyToggleHint: t("requiredSurveyToggleHint"),
  noQuestionsTitle: t("noSurveyTitle"),
  noQuestionsDescription: t("noSurveyDescription"),
  questionTitle: ({ number }: { number: number }) =>
    t("questionTitle", { number }),
  optionalLabel: t("optionalLabel"),
  requiredLabel: t("requiredLabel"),
  removeQuestionLabel: t("removeLabel"),
  questionTypeLabel: t("questionTypeLabel"),
  typeChoice: t("typeChoice"),
  typeFreeText: t("typeFreeText"),
  choiceDisplayLabel: t("choiceDisplayLabel"),
  choiceDisplayAuto: t("choiceDisplayAuto"),
  choiceDisplayList: t("choiceDisplayList"),
  choiceDisplayDropdown: t("choiceDisplayDropdown"),
  questionPromptLabel: t("questionPromptLabel"),
  minSelectionsLabel: t("minSelectionsLabel"),
  maxSelectionsLabel: t("maxSelectionsLabel"),
  minTextLengthLabel: t("minTextLengthLabel"),
  maxTextLengthLabel: t("maxTextLengthLabel"),
  optionLabel: ({ number }: { number: number }) => t("optionLabel", { number }),
  addOptionLabel: t("addOptionLabel"),
  addQuestionLabel: t("addQuestionLabel"),
  cancelLabel: t("cancelLabel"),
  confirmRemoveQuestionMessage: t("confirmRemoveQuestionMessage"),
  confirmRemoveOptionMessage: t("confirmRemoveOptionMessage"),
  confirmRemoveQuestionButtonLabel: t("confirmRemoveQuestionButtonLabel"),
  confirmRemoveOptionButtonLabel: t("confirmRemoveOptionButtonLabel"),
  largeOptionCountWarning: ({
    count,
    threshold,
  }: {
    count: number;
    threshold: number;
  }) => t("largeOptionCountWarning", { count, threshold }),
  questionSemanticChangeLabel: t("questionSemanticChangeLabel"),
  questionSemanticChangeHint: t("questionSemanticChangeHint"),
  optionSemanticChangeLabel: t("optionSemanticChangeLabel"),
  optionSemanticChangeHint: t("optionSemanticChangeHint"),
}));

function clearSurveyValidationError(): void {
  surveyValidationErrorMessage.value = null;
}

function showSurveyValidationError(): void {
  surveyValidationErrorMessage.value = t("validationError");
}

async function redirectToConversation(): Promise<void> {
  const session = editStore.session;
  if (session?.original.conversationSlugId === conversationSlugId.value) {
    session.original.surveyConfig = cloneSurveyConfig({
      surveyConfig: surveyConfig.value,
    });
    session.form.surveyConfig = cloneSurveyConfig({
      surveyConfig: surveyConfig.value,
    });
    await router.replace({
      name: "/conversation/[conversationSlugId]/edit/",
      params: { conversationSlugId: conversationSlugId.value },
      query: route.query,
    });
    return;
  }
  const returnPath = getConversationEditReturnPath({
    conversationSlugId: conversationSlugId.value,
    returnTo: route.query.returnTo,
  });
  await router.replace(returnPath);
}

function requestDeleteSurvey(): void {
  if (!canDeleteSurvey.value) {
    return;
  }

  showDeleteDialog.value = true;
}

async function saveSurvey(): Promise<void> {
  if (!canEditSurvey.value) {
    showNotifyMessage(t("saveError"));
    return;
  }

  const normalizedSurveyConfigResult = buildSurveyConfigForSave({
    surveyConfig: surveyConfig.value,
  });
  if (!normalizedSurveyConfigResult.success) {
    showNotifyMessage(t("validationError"));
    showSurveyValidationError();
    return;
  }

  if (normalizedSurveyConfigResult.surveyConfig === null) {
    if (originalSurveyConfig.value !== null) {
      requestDeleteSurvey();
      return;
    }

    await redirectToConversation();
    return;
  }

  isSaving.value = true;

  try {
    await updateSurveyConfigMutation.mutateAsync({
      surveyConfig: normalizedSurveyConfigResult.surveyConfig,
    });
  } catch {
    isSaving.value = false;
    showNotifyMessage(t("saveError"));
    return;
  }

  isSaving.value = false;

  originalSurveyConfig.value = cloneSurveyConfig({
    surveyConfig: normalizedSurveyConfigResult.surveyConfig,
  });
  surveyConfig.value = cloneSurveyConfig({
    surveyConfig: normalizedSurveyConfigResult.surveyConfig,
  });
  await redirectToConversation();
}

async function deleteSurvey(): Promise<void> {
  isDeleting.value = true;

  try {
    await deleteSurveyConfigMutation.mutateAsync();
  } catch {
    isDeleting.value = false;
    showNotifyMessage(t("deleteError"));
    return;
  }

  isDeleting.value = false;

  surveyConfig.value = null;
  originalSurveyConfig.value = null;
  await redirectToConversation();
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  padding-top: 0.5rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-card__title {
  font-size: 1rem;
  font-weight: 600;
}

.summary-card__empty {
  color: #6b7280;
  line-height: 1.4;
}

.summary-card__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
