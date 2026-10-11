import { defineStore } from "pinia";
import { getConversationUpdatesOverrideUpdate } from "src/components/newConversation/createConversationUpdatesSettingsLogic";
import type { ConversationFormState } from "src/composables/conversation/draft/conversationDraft.types";
import type {
  ConversationEmailUpdateConfigurationResponse,
  GetConversationForEditResponse,
  UpdateConversationRequest,
} from "src/shared/types/dto";
import type { ConversationProjectTarget } from "src/shared/types/zod";
import { getConversationProjectTargetKey } from "src/shared/utils/conversationProject";
import { useAuthenticationStore } from "src/stores/authentication";
import { computed, ref, watch } from "vue";

export type EditableConversation = Extract<
  GetConversationForEditResponse,
  { success: true }
>;
export type ConversationUpdatesConfiguration = Extract<
  Extract<
    ConversationEmailUpdateConfigurationResponse,
    { success: true }
  >["configuration"],
  { target: "conversation" }
>;

export interface EditConversationDetails {
  original: EditableConversation;
  form: ConversationFormState;
  projectTarget: ConversationProjectTarget;
  emailConfiguration: ConversationUpdatesConfiguration | undefined;
  emailOverride: boolean | undefined;
  originalEmailOverride: boolean | undefined;
}

export interface EditConversationSession extends EditConversationDetails {
  newSeedOpinions: string[];
  isSaving: boolean;
}

export function createEditConversationForm(
  original: EditableConversation
): ConversationFormState {
  return {
    title: original.conversationTitle,
    content: original.conversationBody ?? "",
    conversationTypeConfig: original.conversationTypeConfig,
    multilingualSetting: original.multilingualSetting,
    selectedProjectSlug: original.projectLanguageProject?.projectSlug,
    inheritProjectLanguages:
      original.languageSettingsSource === "project_inherited" &&
      original.projectLanguageProject !== undefined,
    isPrivate: !original.isIndexed,
    participationMode: original.participationMode,
    requiresEventTicket: original.requiresEventTicket,
    aiLabelingEnabled: original.aiLabelingEnabled,
    preferredOpinionGroupCount: original.preferredOpinionGroupCount,
    surveyConfig: original.surveyConfig ?? null,
  };
}

export function buildEditConversationRequest(
  details: EditConversationDetails
): UpdateConversationRequest {
  const {
    original,
    form,
    projectTarget,
    emailOverride,
    originalEmailOverride,
  } = details;
  return {
    conversationSlugId: original.conversationSlugId,
    projectChange:
      getConversationProjectTargetKey(projectTarget) ===
      getConversationProjectTargetKey(original.projectTarget)
        ? undefined
        : {
            expectedProjectSlug: original.currentProjectSlug,
            target: projectTarget,
          },
    conversationTitle: form.title,
    // A seed-only update must preserve an absent body rather than create a content revision.
    conversationBody:
      form.content === "" && original.conversationBody === undefined
        ? undefined
        : form.content,
    isIndexed: !form.isPrivate,
    participationMode: form.participationMode,
    requiresEventTicket: form.requiresEventTicket,
    multilingualSetting: {
      dynamicTranslationEnabled:
        form.multilingualSetting.dynamicTranslationEnabled,
      additionalLanguageCodes: [
        ...form.multilingualSetting.additionalLanguageCodes,
      ].sort(),
    },
    languageSettingsSource:
      projectTarget.kind === "project" && form.inheritProjectLanguages
        ? "project_inherited"
        : "conversation_override",
    conversationTypeConfig:
      form.conversationTypeConfig.conversationType === "polis"
        ? {
            conversationType: "polis",
            votingPresentation: form.conversationTypeConfig.votingPresentation,
            aiLabelingEnabled: form.aiLabelingEnabled,
            preferredOpinionGroupCount: form.preferredOpinionGroupCount,
          }
        : form.conversationTypeConfig,
    conversationEmailUpdateEnabledOverride:
      getConversationUpdatesOverrideUpdate({
        currentOverride: emailOverride,
        originalOverride: originalEmailOverride,
      }),
  };
}

export function hasEditConversationDetailsChanges(
  details: EditConversationDetails
): boolean {
  const baseline = buildEditConversationRequest({
    ...details,
    form: createEditConversationForm(details.original),
    projectTarget: details.original.projectTarget,
    emailOverride: details.originalEmailOverride,
  });
  return (
    JSON.stringify(buildEditConversationRequest(details)) !==
    JSON.stringify(baseline)
  );
}

export const useEditConversationStore = defineStore("editConversation", () => {
  const auth = useAuthenticationStore();
  const session = ref<EditConversationSession>();
  const isSaving = computed(() => session.value?.isSaving ?? false);
  const hasUnsavedChanges = computed(
    () =>
      session.value !== undefined &&
      (session.value.newSeedOpinions.length > 0 ||
        hasEditConversationDetailsChanges(session.value))
  );

  function start(value: EditConversationSession): void {
    session.value = value;
  }
  function clear(): void {
    session.value = undefined;
  }

  watch([() => auth.userId, () => auth.isLoggedIn], clear, { flush: "sync" });

  return { session, isSaving, hasUnsavedChanges, start, clear };
});
