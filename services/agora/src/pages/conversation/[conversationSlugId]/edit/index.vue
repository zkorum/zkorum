<template>
  <NewConversationLayout v-slot="{ isActive }">
    <Teleport v-if="isActive" to="#page-header">
      <DefaultMenuBar :click-to-scroll-top="false">
        <template #left>
          <BackButton />
        </template>
        <template #right>
          <PrimeButton
            v-if="isNextButtonDisabled"
            :label="seedT('nextButton')"
            disabled
          />
          <SpaLink v-else :to="seedRoute" deferred @click="onNext">
            <PrimeButton as="span" :label="seedT('nextButton')" />
          </SpaLink>
        </template>
      </DefaultMenuBar>
    </Teleport>

    <div v-if="loadError" class="error-container">
      <ZKCard class="error-card" padding="1.5rem">
        <div class="error-content">
          <q-icon name="mdi-alert-circle" class="error-icon" />
          <div class="error-text">
            <div class="error-title">{{ errorTitle }}</div>
            <div class="error-message">{{ errorMessage }}</div>
          </div>
        </div>
      </ZKCard>
    </div>

    <PageLoadingSpinner v-else-if="!hasLoadedSession" />

    <div v-else class="container">
      <NewConversationControlBar
        v-model:is-private="isPrivate"
        v-model:requires-event-ticket="requiresEventTicket"
        v-model:import-settings="importSettings"
        v-model:external-source-config="externalSourceConfig"
        v-model:title="title"
        v-model:content="content"
        v-model:multilingual-setting="multilingualSetting"
        v-model:conversation-type-config="conversationTypeConfig"
        v-model:ai-labeling-enabled="aiLabelingEnabled"
        v-model:preferred-opinion-group-count="preferredOpinionGroupCount"
        :post-as="postAs"
        :allowed-post-as="allowedPostAs"
        :participation-mode="participationMode"
        :is-edit-mode="true"
        :can-add-event-ticket="canAddEventTicket"
        :can-change-event-ticket="canChangeEventTicket"
        :can-remove-event-ticket="canRemoveEventTicket"
        :can-use-analysis-variants-preference="canUseAnalysisVariantsPreference"
        :can-use-dynamic-translation="canUseDynamicTranslation"
        :hide-language-setting="currentProjectLanguageProject !== undefined"
        :detected-language-code="visibleDetectedLanguageCode"
        :detected-source-language-code="visibleDetectedSourceLanguageCode"
        :detected-raw-language-code="visibleDetectedRawLanguageCode"
        :auto-detection-status="visibleAutoDetectionStatus"
        @update:participation-mode="updateParticipationModeWithReachWarning"
        @update:post-as="updatePostAs"
      >
        <template #extra-controls>
          <ConversationProjectSelect
            v-if="
              projectTarget !== undefined && projectSelectOptions.length > 0
            "
            :options="projectSelectOptions"
            :model-value="projectTarget"
            :fallback-label="currentProjectLanguageProject?.projectTitle"
            @update:model-value="selectProject"
          />
          <ConversationProjectLanguageSettings
            v-if="currentProjectLanguageProject !== undefined"
            v-model:inherit-project-languages="inheritProjectLanguages"
            v-model:override-multilingual-setting="multilingualSetting"
            :project="currentProjectLanguageProject"
            :can-use-dynamic-translation="canUseDynamicTranslation"
            :detected-language-code="visibleDetectedLanguageCode"
          />
          <CreateConversationUpdatesSettings
            :model-value="conversationUpdatesOverride"
            :scope-kind="
              projectTarget?.kind === 'project' ? 'project' : 'no-project'
            "
            :project-title="currentProjectLanguageProject?.projectTitle"
            :scope-default-enabled="conversationUpdatesScopeDefault"
            :access="
              selectedEmailUpdatesConfiguration?.canConfigure === true
                ? 'configure'
                : hasProjectChange
                  ? 'disable_only'
                  : 'none'
            "
            :has-participant-contact-email="
              selectedEmailUpdatesConfiguration?.hasParticipantContactEmail ===
              true
            "
            mode="edit"
            @update:model-value="updateEmailUpdatesWithReachWarning"
          />
        </template>
      </NewConversationControlBar>

      <ConversationUpdatesPartialEmailReachDialog
        v-model="partialEmailReachWarningMode"
        @action="handlePartialEmailReachAction"
      />

      <ZKCard
        v-if="showPremiumEditRestrictedBanner"
        class="premium-restricted-banner"
        padding="1rem"
      >
        <q-icon name="mdi-lock-alert-outline" class="premium-restricted-icon" />
        <span>{{ t("premiumEditRestrictedBanner") }}</span>
      </ZKCard>

      <div class="contentFlexStyle">
        <div v-if="isSurveyFeatureAllowed" class="surveyActionRow">
          <q-btn
            flat
            no-caps
            color="primary"
            :label="responseSurveyButtonLabel"
            @click="openSurveyEditor"
          />
        </div>

        <div ref="titleInputRef">
          <div v-if="validationState.title.showError" class="titleErrorMessage">
            <q-icon name="mdi-alert-circle" class="titleErrorIcon" />
            {{ validationState.title.error }}
          </div>

          <Editor
            v-model="title"
            outlined
            :placeholder="t('titlePlaceholder')"
            :show-toolbar="false"
            :single-line="true"
            :disabled="!canEditConversationContent"
            :max-length="MAX_LENGTH_CONVERSATION_TITLE"
            :show-character-count="true"
            min-height="auto"
            @update:model-value="updateTitle"
            @update:is-over-limit="(v: boolean) => (isTitleOverLimit = v)"
          />
        </div>

        <div>
          <div class="editor-style">
            <Editor
              v-model="content"
              outlined
              :placeholder="t('bodyPlaceholder')"
              min-height="5rem"
              :show-toolbar="true"
              :single-line="false"
              :disabled="!canEditConversationContent"
              :max-length="MAX_LENGTH_CONVERSATION_BODY"
              :show-character-count="true"
              @update:model-value="updateContent"
              @update:is-over-limit="(v: boolean) => (isBodyOverLimit = v)"
            />
          </div>
        </div>
      </div>
    </div>
    <EditConversationRouteGuard
      :conversation-slug-id="conversationSlugId"
      :navigation-pending="editStore.isSaving"
      :has-unsaved-changes="hasUnsavedChanges || editStore.hasUnsavedChanges"
    />
  </NewConversationLayout>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Editor from "src/components/editor/Editor.vue";
import BackButton from "src/components/navigation/buttons/BackButton.vue";
import DefaultMenuBar from "src/components/navigation/header/DefaultMenuBar.vue";
import {
  type ConversationProjectEditTranslations,
  conversationProjectEditTranslations,
} from "src/components/newConversation/conversationProjectEdit.i18n";
import { getProjectLanguageOverride } from "src/components/newConversation/conversationProjectLanguage";
import ConversationProjectLanguageSettings from "src/components/newConversation/ConversationProjectLanguageSettings.vue";
import ConversationProjectSelect from "src/components/newConversation/ConversationProjectSelect.vue";
import ConversationUpdatesPartialEmailReachDialog from "src/components/newConversation/ConversationUpdatesPartialEmailReachDialog.vue";
import {
  areConversationUpdatesReachStatesEqual,
  type ConversationUpdatesReachState,
  getPartialEmailReachWarning,
  getUnacknowledgedPartialEmailReachWarning,
  type PartialEmailReachAction,
  type PartialEmailReachParticipationMode,
  resolvePartialEmailReachAction,
} from "src/components/newConversation/conversationUpdatesPartialEmailReachLogic";
import CreateConversationUpdatesSettings from "src/components/newConversation/CreateConversationUpdatesSettings.vue";
import {
  getEditConversationPostAsOptions,
  getEditConversationProjectSelectOptions,
} from "src/components/newConversation/editConversationProjectOptions";
import EditConversationRouteGuard from "src/components/newConversation/EditConversationRouteGuard.vue";
import NewConversationControlBar from "src/components/newConversation/NewConversationControlBar.vue";
import NewConversationLayout from "src/components/newConversation/NewConversationLayout.vue";
import { seedOpinionsTranslations } from "src/components/newConversation/SeedOpinions.i18n";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import SpaLink from "src/components/ui-library/SpaLink.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import {
  type PostAsSettings,
  useConversationDraft,
  type ValidationErrorField,
} from "src/composables/conversation/draft";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import {
  MAX_LENGTH_CONVERSATION_BODY,
  MAX_LENGTH_CONVERSATION_TITLE,
} from "src/shared/shared";
import type { GetConversationForEditResponse } from "src/shared/types/dto";
import type {
  ConversationProjectTarget,
  ParticipationMode,
} from "src/shared/types/zod";
import { getConversationProjectTargetKey } from "src/shared/utils/conversationProject";
import { useAuthenticationStore } from "src/stores/authentication";
import {
  type ConversationUpdatesConfiguration,
  createEditConversationForm,
  type EditConversationDetails,
  hasEditConversationDetailsChanges,
  useEditConversationStore,
} from "src/stores/editConversation";
import { useBackendConversationEmailUpdatesApi } from "src/utils/api/conversationUpdates/conversationEmailUpdates";
import { useBackendPostEditApi } from "src/utils/api/post/postEdit";
import { getSingleRouteParam } from "src/utils/router/params";
import { useNotify } from "src/utils/ui/notify";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
} from "vue-router";

import {
  type EditConversationTranslations,
  editConversationTranslations,
} from "./index.i18n";

defineOptions({
  components: {
    PrimeButton: Button,
  },
});

const { t } = useComponentI18n<EditConversationTranslations>(
  editConversationTranslations
);
const { t: tProjectEdit } =
  useComponentI18n<ConversationProjectEditTranslations>(
    conversationProjectEditTranslations
  );
const { showNotifyMessage } = useNotify();

const route = useRoute();
const router = useRouter();
const { getConversationForEdit } = useBackendPostEditApi();
const editStore = useEditConversationStore();
const auth = useAuthenticationStore();
const { t: seedT } = useComponentI18n(seedOpinionsTranslations);

const conversationSlugId = computed(() =>
  getSingleRouteParam(route.params.conversationSlugId)
);

const seedRoute = computed(() => ({
  name: "/conversation/[conversationSlugId]/edit/seed/" as const,
  params: { conversationSlugId: conversationSlugId.value },
  query: route.query,
}));
const isTitleOverLimit = ref(false);
const isBodyOverLimit = ref(false);
const isDataLoaded = ref(false);
const loadError = ref(false);
const errorTitle = ref("");
const errorMessage = ref("");

type EditConversationData = Extract<
  GetConversationForEditResponse,
  { success: true }
>;
const loadedConversation = ref<EditConversationData>();
const projectTarget = ref<ConversationProjectTarget>();
const allowedPostAs = computed(() =>
  loadedConversation.value === undefined
    ? []
    : getEditConversationPostAsOptions(loadedConversation.value)
);
const hasProjectChange = computed(
  () =>
    projectTarget.value !== undefined &&
    loadedConversation.value !== undefined &&
    getConversationProjectTargetKey(projectTarget.value) !==
      getConversationProjectTargetKey(loadedConversation.value.projectTarget)
);
const projectSelectOptions = computed(() => {
  const conversation = loadedConversation.value;
  if (conversation === undefined) return [];
  return getEditConversationProjectSelectOptions({
    conversation,
    postAs: postAs.value,
  });
});
const editPermissions = computed(
  () => loadedConversation.value?.editPermissions
);
const hasLoadedSession = computed(
  () =>
    isDataLoaded.value &&
    editStore.session?.original.conversationSlugId === conversationSlugId.value
);

const titleInputRef = ref<HTMLDivElement>();

const responseSurveyButtonLabel = computed(() => {
  return loadedConversation.value?.surveyConfig == null
    ? t("createSurveyButton")
    : t("editSurveyButton");
});
const isSurveyFeatureAllowed = computed(() => {
  return (
    editPermissions.value?.canEditSurvey === true ||
    (loadedConversation.value?.surveyConfig != null &&
      editPermissions.value?.canDeleteSurvey === true)
  );
});
const canEditConversationContent = computed(() => {
  return (
    !editStore.isSaving &&
    editPermissions.value?.canEditConversationContent === true
  );
});
const canAddEventTicket = computed(() => {
  return editPermissions.value?.canAddEventTicket ?? true;
});
const canChangeEventTicket = computed(() => {
  return editPermissions.value?.canChangeEventTicket ?? true;
});
const canRemoveEventTicket = computed(() => {
  return editPermissions.value?.canRemoveEventTicket ?? true;
});
const canUseAnalysisVariantsPreference = computed(() => {
  if (hasProjectChange.value)
    return (
      selectedProjectOption.value?.premiumFeatures.includes(
        "analysis_variants"
      ) ?? false
    );
  return editPermissions.value?.canUseAnalysisVariantsPreference ?? false;
});
const canUseDynamicTranslation = computed(() => {
  if (hasProjectChange.value)
    return (
      selectedProjectOption.value?.premiumFeatures.includes(
        "dynamic_translation"
      ) ?? false
    );
  return editPermissions.value?.canUseDynamicTranslation ?? false;
});
const showPremiumEditRestrictedBanner = computed(() => {
  return (editPermissions.value?.restrictedPremiumFeatures.length ?? 0) > 0;
});

const hasUnsavedChanges = computed(() => {
  const details = getLiveDetails();
  return (
    hasLoadedSession.value &&
    details !== undefined &&
    hasEditConversationDetailsChanges(details)
  );
});

// Use conversation draft composable (no store sync for edit page)
const {
  title,
  content,
  multilingualSetting,
  selectedProjectSlug,
  inheritProjectLanguages,
  isPrivate,
  participationMode,
  requiresEventTicket,
  aiLabelingEnabled,
  preferredOpinionGroupCount,
  postAs,
  importSettings,
  externalSourceConfig,
  conversationTypeConfig,
  validationState,
  validateTitle,
  validateBody,
  updateTitle,
  updateContent,
  initializeFromData,
  getDraftSnapshot,
  surveyConfig,
} = useConversationDraft({ syncToStore: false });
const conversationEmailUpdatesApi = useBackendConversationEmailUpdatesApi();
const conversationUpdatesConfiguration = ref<
  ConversationUpdatesConfiguration | undefined
>(undefined);
const conversationUpdatesOverride = ref<boolean | undefined>(undefined);
const originalConversationUpdatesOverride = ref<boolean | undefined>(undefined);
const selectedProjectOption = computed(() =>
  loadedConversation.value?.projectOptions.find(
    (option) =>
      projectTarget.value !== undefined &&
      getConversationProjectTargetKey(option.target) ===
        getConversationProjectTargetKey(projectTarget.value)
  )
);
const selectedEmailUpdatesConfiguration = computed(() => {
  if (hasProjectChange.value) return selectedProjectOption.value?.emailUpdates;
  const configuration = conversationUpdatesConfiguration.value;
  return configuration === undefined
    ? undefined
    : {
        canConfigure: configuration.canConfigure,
        hasParticipantContactEmail:
          configuration.participantContactEmail !== undefined,
        scopeDefaultEnabled: configuration.scopeDefaultEnabled,
      };
});
const conversationUpdatesScopeDefault = computed(
  () => selectedEmailUpdatesConfiguration.value?.scopeDefaultEnabled ?? false
);
const partialEmailReachWarningMode = ref<
  PartialEmailReachParticipationMode | undefined
>(undefined);
const acknowledgedPartialEmailReachState = ref<
  ConversationUpdatesReachState | undefined
>(undefined);

function getEditConversationUpdatesReachState({
  mode,
  override,
}: {
  mode: ParticipationMode;
  override: boolean | undefined;
}): ConversationUpdatesReachState {
  const configuration = selectedEmailUpdatesConfiguration.value;
  return {
    participationMode: mode,
    effectiveEmailUpdatesEnabled:
      configuration !== undefined &&
      configuration.hasParticipantContactEmail &&
      (override ?? configuration.scopeDefaultEnabled),
  };
}

function showReachWarningForTransition({
  previous,
  next,
}: {
  previous: ConversationUpdatesReachState;
  next: ConversationUpdatesReachState;
}): void {
  if (
    !areConversationUpdatesReachStatesEqual({ left: previous, right: next })
  ) {
    acknowledgedPartialEmailReachState.value = undefined;
  }
  const warningMode = getPartialEmailReachWarning({
    previous,
    next,
  });
  if (warningMode !== undefined) {
    partialEmailReachWarningMode.value = warningMode;
  }
}

function updateParticipationModeWithReachWarning(
  mode: ParticipationMode
): void {
  const previous = getEditConversationUpdatesReachState({
    mode: participationMode.value,
    override: conversationUpdatesOverride.value,
  });
  participationMode.value = mode;
  showReachWarningForTransition({
    previous,
    next: getEditConversationUpdatesReachState({
      mode,
      override: conversationUpdatesOverride.value,
    }),
  });
}

function updateEmailUpdatesWithReachWarning(
  override: boolean | undefined
): void {
  const previous = getEditConversationUpdatesReachState({
    mode: participationMode.value,
    override: conversationUpdatesOverride.value,
  });
  conversationUpdatesOverride.value = override;
  showReachWarningForTransition({
    previous,
    next: getEditConversationUpdatesReachState({
      mode: participationMode.value,
      override,
    }),
  });
}

function handlePartialEmailReachAction(action: PartialEmailReachAction): void {
  const resolution = resolvePartialEmailReachAction({
    action,
    participationMode: participationMode.value,
    conversationEmailUpdateEnabledOverride: conversationUpdatesOverride.value,
  });
  participationMode.value = resolution.participationMode;
  conversationUpdatesOverride.value =
    resolution.conversationEmailUpdateEnabledOverride;
  acknowledgedPartialEmailReachState.value =
    action === "keep_updates_on"
      ? getEditConversationUpdatesReachState({
          mode: participationMode.value,
          override: conversationUpdatesOverride.value,
        })
      : undefined;
  partialEmailReachWarningMode.value = undefined;
}

const currentProjectLanguageProject = computed<
  EditConversationData["projectLanguageProject"]
>(() => {
  if (!hasProjectChange.value)
    return loadedConversation.value?.projectLanguageProject;
  const option = selectedProjectOption.value;
  if (option === undefined || !("languageSettings" in option)) return undefined;
  return {
    projectSlug: option.target.projectSlug,
    projectTitle: option.title,
    defaultLanguageCode: option.defaultLanguageCode,
    languageSettings: option.languageSettings,
  };
});

function updatePostAs(selection: PostAsSettings): void {
  if (
    selection.postAsOrganization === postAs.value.postAsOrganization &&
    selection.organizationName === postAs.value.organizationName
  )
    return;
  const conversation = loadedConversation.value;
  if (conversation === undefined) return;
  const options = getEditConversationProjectSelectOptions({
    conversation,
    postAs: selection,
  });
  const target =
    options.find((option) => option.target.kind === "no_project") ??
    options.at(0);
  if (target === undefined) {
    showNotifyMessage(tProjectEdit("projectPermissionError"));
    return;
  }
  if (applyProjectTarget(target.target)) postAs.value = selection;
}

function selectProject(target: ConversationProjectTarget): void {
  const option = projectSelectOptions.value.find(
    (option) =>
      getConversationProjectTargetKey(option.target) ===
      getConversationProjectTargetKey(target)
  );
  if (option !== undefined) applyProjectTarget(option.target);
}

function applyProjectTarget(target: ConversationProjectTarget): boolean {
  if (
    projectTarget.value !== undefined &&
    getConversationProjectTargetKey(projectTarget.value) ===
      getConversationProjectTargetKey(target)
  )
    return true;
  const previous = getEditConversationUpdatesReachState({
    mode: participationMode.value,
    override: conversationUpdatesOverride.value,
  });
  if (
    target.kind === "no_project" &&
    inheritProjectLanguages.value &&
    currentProjectLanguageProject.value !== undefined
  ) {
    const override = getProjectLanguageOverride({
      project: currentProjectLanguageProject.value,
      detectedLanguageCode: visibleDetectedLanguageCode.value,
      canUseDynamicTranslation:
        loadedConversation.value?.projectOptions
          .find(
            (option) =>
              getConversationProjectTargetKey(option.target) ===
              getConversationProjectTargetKey(target)
          )
          ?.premiumFeatures.includes("dynamic_translation") ?? false,
    });
    if (!override.success) {
      showNotifyMessage(tProjectEdit("detachLanguagesError"));
      return false;
    }
    multilingualSetting.value = override.data;
  }
  projectTarget.value = target;
  selectedProjectSlug.value =
    target.kind === "project" ? target.projectSlug : undefined;
  if (target.kind === "no_project") inheritProjectLanguages.value = false;
  showReachWarningForTransition({
    previous,
    next: getEditConversationUpdatesReachState({
      mode: participationMode.value,
      override: conversationUpdatesOverride.value,
    }),
  });
  return true;
}

const canShowStoredAutoDetection = computed(() => {
  const original = loadedConversation.value;
  return (
    original !== undefined &&
    title.value === original.conversationTitle &&
    content.value === (original.conversationBody ?? "")
  );
});

const visibleDetectedLanguageCode = computed(() =>
  canShowStoredAutoDetection.value
    ? loadedConversation.value?.contentLanguageMetadata
        .detectedDisplayLanguageCode
    : undefined
);
const visibleDetectedSourceLanguageCode = computed(() =>
  canShowStoredAutoDetection.value
    ? loadedConversation.value?.contentLanguageMetadata
        .detectedSourceLanguageCode
    : undefined
);
const visibleDetectedRawLanguageCode = computed(() =>
  canShowStoredAutoDetection.value
    ? loadedConversation.value?.contentLanguageMetadata.detectedRawLanguageCode
    : undefined
);
const visibleAutoDetectionStatus = computed(() =>
  canShowStoredAutoDetection.value
    ? loadedConversation.value?.contentLanguageMetadata.autoDetectionStatus
    : undefined
);

const isNextButtonDisabled = computed(() => {
  return (
    !hasLoadedSession.value ||
    editStore.isSaving ||
    isTitleOverLimit.value ||
    isBodyOverLimit.value
  );
});

async function scrollToTitleInput() {
  await nextTick();
  titleInputRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

async function handleValidationError(
  errorField: ValidationErrorField
): Promise<void> {
  switch (errorField) {
    case "title":
      validateTitle();
      await scrollToTitleInput();
      break;
    case "body":
      validateBody();
      break;
    case "polisUrl":
      // Not applicable for edit page
      break;
  }
}

function validateSubmission(): {
  isValid: boolean;
  errorField?: ValidationErrorField;
} {
  // Validate title
  if (!validateTitle().success) {
    return { isValid: false, errorField: "title" };
  }

  // Validate body
  if (!validateBody().success) {
    return { isValid: false, errorField: "body" };
  }

  return { isValid: true };
}

function getLiveDetails(): EditConversationDetails | undefined {
  const original = loadedConversation.value;
  const target = projectTarget.value;
  if (original === undefined || target === undefined) return undefined;
  return {
    original,
    projectTarget: target,
    form: {
      title: title.value,
      content: content.value,
      multilingualSetting: multilingualSetting.value,
      selectedProjectSlug: selectedProjectSlug.value,
      inheritProjectLanguages: inheritProjectLanguages.value,
      isPrivate: isPrivate.value,
      participationMode: participationMode.value,
      requiresEventTicket: requiresEventTicket.value,
      conversationTypeConfig: conversationTypeConfig.value,
      aiLabelingEnabled: aiLabelingEnabled.value,
      preferredOpinionGroupCount: preferredOpinionGroupCount.value,
      surveyConfig: surveyConfig.value,
    },
    emailConfiguration: conversationUpdatesConfiguration.value,
    emailOverride: conversationUpdatesOverride.value,
    originalEmailOverride: originalConversationUpdatesOverride.value,
  };
}

async function onNext(event: MouseEvent): Promise<void> {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  if (isNextButtonDisabled.value) return;
  const validation = validateSubmission();
  if (!validation.isValid) {
    if (validation.errorField) {
      await handleValidationError(validation.errorField);
    }
    return;
  }

  const reachState = getEditConversationUpdatesReachState({
    mode: participationMode.value,
    override: conversationUpdatesOverride.value,
  });
  const warningMode = getUnacknowledgedPartialEmailReachWarning({
    state: reachState,
    acknowledgedState: acknowledgedPartialEmailReachState.value,
  });
  if (warningMode !== undefined) {
    partialEmailReachWarningMode.value = warningMode;
    return;
  }

  await router.push(seedRoute.value);
}

function persistDetails(): void {
  const details = getLiveDetails();
  const session = editStore.session;
  if (!hasLoadedSession.value || details === undefined || session === undefined)
    return;
  session.form = getDraftSnapshot();
  session.postAs = postAs.value;
  session.projectTarget = details.projectTarget;
  session.emailConfiguration = details.emailConfiguration;
  session.emailOverride = details.emailOverride;
}
onBeforeRouteLeave(persistDetails);
onBeforeRouteUpdate(persistDetails);

async function openSurveyEditor(): Promise<void> {
  await router.push({
    name: "/conversation/[conversationSlugId]/edit/survey/",
    params: { conversationSlugId: conversationSlugId.value },
    query: route.query,
  });
}

function applyConversationUpdatesConfiguration(
  configuration: ConversationUpdatesConfiguration
): void {
  conversationUpdatesConfiguration.value = configuration;
  if (configuration.setting === "inherit") {
    conversationUpdatesOverride.value = undefined;
    return;
  }
  conversationUpdatesOverride.value = configuration.setting === "enabled";
}

async function loadConversationUpdatesConfiguration(
  slug: string
): Promise<ConversationUpdatesConfiguration | undefined> {
  try {
    const response = await conversationEmailUpdatesApi.getConfiguration({
      target: "conversation",
      conversationSlugId: slug,
    });
    if (!response.success || response.configuration.target !== "conversation") {
      return undefined;
    }
    return response.configuration;
  } catch (error) {
    console.error(
      "Failed to load conversation Email Update configuration",
      error
    );
    return undefined;
  }
}

let isAlive = true;
onBeforeUnmount(() => {
  isAlive = false;
});

async function loadConversation(): Promise<void> {
  const slug = conversationSlugId.value;
  const userId = auth.userId;
  isDataLoaded.value = false;
  loadError.value = false;
  loadedConversation.value = undefined;
  isTitleOverLimit.value = false;
  isBodyOverLimit.value = false;
  conversationUpdatesConfiguration.value = undefined;
  conversationUpdatesOverride.value = undefined;
  originalConversationUpdatesOverride.value = undefined;
  partialEmailReachWarningMode.value = undefined;
  try {
    if (!slug) {
      loadError.value = true;
      errorTitle.value = t("notFoundErrorTitle");
      errorMessage.value = t("notFoundErrorMessage");
      return;
    }
    if (!auth.isLoggedIn || userId === undefined) {
      loadError.value = true;
      errorTitle.value = t("notAuthorErrorTitle");
      errorMessage.value = t("notAuthorErrorMessage");
      return;
    }

    const savedSession =
      editStore.session?.original.conversationSlugId === slug
        ? editStore.session
        : undefined;
    const response =
      savedSession?.original ?? (await getConversationForEdit(slug));
    if (
      !isAlive ||
      slug !== conversationSlugId.value ||
      userId !== auth.userId ||
      !auth.isLoggedIn
    )
      return;

    if (!response.success) {
      loadError.value = true;
      if (response.reason === "not_found") {
        errorTitle.value = t("notFoundErrorTitle");
        errorMessage.value = t("notFoundErrorMessage");
      } else if (response.reason === "not_author") {
        errorTitle.value = t("notAuthorErrorTitle");
        errorMessage.value = t("notAuthorErrorMessage");
      }
      return;
    }

    // Check if conversation is locked
    if (response.isLocked) {
      loadError.value = true;
      errorTitle.value = t("conversationLockedErrorTitle");
      errorMessage.value = t("conversationLockedErrorMessage");
      return;
    }

    loadedConversation.value = response;
    projectTarget.value = savedSession?.projectTarget ?? response.projectTarget;
    postAs.value = savedSession?.postAs ?? {
      postAsOrganization: response.postAsOrganizationSlug !== undefined,
      organizationName: response.postAsOrganizationSlug ?? "",
    };

    initializeFromData(
      savedSession?.form ?? createEditConversationForm(response)
    );
    externalSourceConfig.value = response.externalSourceConfig;

    if (savedSession !== undefined) {
      conversationUpdatesConfiguration.value = savedSession.emailConfiguration;
      conversationUpdatesOverride.value = savedSession.emailOverride;
      originalConversationUpdatesOverride.value =
        savedSession.originalEmailOverride;
    } else {
      const configuration = await loadConversationUpdatesConfiguration(slug);
      if (
        !isAlive ||
        slug !== conversationSlugId.value ||
        userId !== auth.userId ||
        !auth.isLoggedIn
      )
        return;
      if (configuration !== undefined)
        applyConversationUpdatesConfiguration(configuration);
      originalConversationUpdatesOverride.value =
        conversationUpdatesOverride.value;
      editStore.start({
        original: response,
        form: getDraftSnapshot(),
        postAs: postAs.value,
        projectTarget: response.projectTarget,
        isSaving: false,
        newSeedOpinions: [],
        emailConfiguration: conversationUpdatesConfiguration.value,
        emailOverride: conversationUpdatesOverride.value,
        originalEmailOverride: originalConversationUpdatesOverride.value,
      });
    }
    acknowledgedPartialEmailReachState.value =
      getEditConversationUpdatesReachState({
        mode: participationMode.value,
        override: conversationUpdatesOverride.value,
      });

    isDataLoaded.value = true;
    if (route.query.editStep === "seed") {
      const query = { ...route.query };
      delete query.editStep;
      await router.replace({ ...seedRoute.value, query });
    }
  } catch (error) {
    if (!isAlive || slug !== conversationSlugId.value || userId !== auth.userId)
      return;
    console.error("Error loading conversation for edit:", error);
    loadError.value = true;
    errorTitle.value = t("loadingErrorTitle");
    errorMessage.value = t("loadingErrorMessage");
  }
}
watch(
  [conversationSlugId, () => auth.userId, () => auth.isLoggedIn],
  () => {
    void loadConversation();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.editor-style {
  margin-bottom: 2rem;
  font-size: 1rem;
}

.contentFlexStyle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.premium-restricted-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: $color-text-weak;
}

.premium-restricted-icon {
  color: $warning;
  font-size: 1.25rem;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-top: 2rem;
  padding-bottom: 8rem;
}

.titleErrorMessage {
  display: flex;
  align-items: center;
  color: $negative;
  font-size: 0.9rem;
}

.titleErrorIcon {
  font-size: 1rem;
  margin-right: 0.5rem;
}

.error-container {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.error-card {
  max-width: 600px;
  width: 100%;
}

.error-content {
  display: flex;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
}

.error-icon {
  font-size: 2rem;
  color: $negative;
  flex-shrink: 0;
}

.error-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-title {
  font-size: 1.2rem;
  font-weight: var(--font-weight-semibold);
  color: $negative;
}

.error-message {
  font-size: 1rem;
  color: $color-text-weak;
}
</style>
