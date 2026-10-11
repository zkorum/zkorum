<template>
  <div class="project-language-settings">
    <ConversationControlButton
      v-if="selectedProject !== undefined"
      :label="languageControlLabel"
      :icon="
        showProjectLanguageDialog ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
      "
      @click="openProjectLanguageSettings"
    />
  </div>

  <q-dialog v-model="showProjectLanguageDialog" position="bottom">
    <ZKBottomDialogContainer
      :title="tLanguage('languagesTitle')"
      :subtitle="tProject('projectLanguagesDescription')"
    >
      <div class="language-settings-list">
        <ConversationLanguageSettingsRow
          v-if="selectedProject !== undefined"
          :title="tProject('inheritProjectLanguagesTitle')"
          :value="selectedProject.projectTitle"
          :description="tProject('inheritProjectLanguagesDescription')"
          :icon="undefined"
          :disabled="false"
          :clickable="false"
        >
          <template #actions>
            <q-toggle
              :model-value="inheritProjectLanguages"
              @update:model-value="setInheritProjectLanguages"
            />
          </template>
        </ConversationLanguageSettingsRow>

        <template
          v-if="selectedProject !== undefined && inheritProjectLanguages"
        >
          <ConversationLanguageSettingsRow
            :title="tLanguage('languagesTitle')"
            :value="projectLanguageDetails"
            :description="tProject('inheritedProjectLanguagesDescription')"
            :icon="undefined"
            :disabled="false"
            :clickable="false"
          />
          <ConversationLanguageSettingsRow
            :title="tLanguage('dynamicTranslationTitle')"
            :value="projectDynamicTranslationSummary"
            :description="tLanguage('dynamicTranslationDescription')"
            :icon="undefined"
            :disabled="false"
            :clickable="false"
          >
            <template #actions>
              <q-toggle
                :model-value="
                  selectedProject.languageSettings.dynamicTranslationEnabled
                "
                @update:model-value="startDynamicTranslationOverride"
              />
            </template>
          </ConversationLanguageSettingsRow>
        </template>

        <template v-else>
          <ConversationLanguageSettingsRow
            :title="tLanguage('languagesTitle')"
            :value="overrideLanguageSummary"
            :description="tProject('customLanguagesDescription')"
            :icon="forwardIcon"
            :disabled="false"
            :clickable="true"
            @click="openOverrideLanguagePicker({ returnToProjectDialog: true })"
          />
          <ConversationLanguageSettingsRow
            :title="tLanguage('dynamicTranslationTitle')"
            :value="undefined"
            :description="tLanguage('dynamicTranslationDescription')"
            :icon="undefined"
            :disabled="false"
            :clickable="false"
          >
            <template #actions>
              <q-toggle
                :model-value="
                  overrideMultilingualSetting.dynamicTranslationEnabled
                "
                @update:model-value="setOverrideDynamicTranslation"
              />
            </template>
          </ConversationLanguageSettingsRow>
        </template>
      </div>
    </ZKBottomDialogContainer>
  </q-dialog>

  <ConversationAdditionalLanguagesDialog
    v-model:show-dialog="showOverrideLanguagePicker"
    v-model:multilingual-setting="languagePickerMultilingualSetting"
    :can-edit-languages="true"
    :show-auto-language="true"
    :auto-language-caption="overrideAutoLanguageCaption"
    :detected-language-code="props.detectedLanguageCode"
    @back="goBackFromOverrideLanguagePicker"
  />
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import ConversationControlButton from "src/components/newConversation/ConversationControlButton.vue";
import {
  type CreateConversationProjectLanguageSettingsTranslations,
  createConversationProjectLanguageSettingsTranslations,
} from "src/components/newConversation/CreateConversationProjectLanguageSettings.i18n";
import ConversationAdditionalLanguagesDialog from "src/components/newConversation/dialog/ConversationAdditionalLanguagesDialog.vue";
import {
  type ConversationLanguageSettingDialogTranslations,
  conversationLanguageSettingDialogTranslations,
} from "src/components/newConversation/dialog/ConversationLanguageSettingDialog.i18n";
import { getLanguageLabel } from "src/components/newConversation/dialog/conversationLanguageSettings.utils";
import ConversationLanguageSettingsRow from "src/components/newConversation/dialog/ConversationLanguageSettingsRow.vue";
import {
  type NewConversationControlBarTranslations,
  newConversationControlBarTranslations,
} from "src/components/newConversation/NewConversationControlBar.i18n";
import ZKBottomDialogContainer from "src/components/ui-library/ZKBottomDialogContainer.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { type SupportedDisplayLanguageCodes } from "src/shared/languages";
import type { GetConversationForEditResponse } from "src/shared/types/dto";
import type {
  ConversationMultilingualSetting,
  ProjectLanguageSettings,
} from "src/shared/types/zod";
import { setConversationDynamicTranslation } from "src/utils/translation/conversationMultilingualSetting";
import { computed, ref } from "vue";

import {
  formatCompactLanguageSummary,
  formatLanguageControlLabel,
} from "./conversationLanguageControlLabel";

type ConversationProjectLanguageProject = NonNullable<
  Extract<
    GetConversationForEditResponse,
    { success: true }
  >["projectLanguageProject"]
>;
const props = defineProps<{
  project: ConversationProjectLanguageProject | undefined;
  detectedLanguageCode: SupportedDisplayLanguageCodes | null | undefined;
}>();
const inheritProjectLanguages = defineModel<boolean>(
  "inheritProjectLanguages",
  {
    required: true,
  }
);
const overrideMultilingualSetting =
  defineModel<ConversationMultilingualSetting>("overrideMultilingualSetting", {
    required: true,
  });

const $q = useQuasar();
const { t: tLanguage } =
  useComponentI18n<ConversationLanguageSettingDialogTranslations>(
    conversationLanguageSettingDialogTranslations
  );
const { t: tProject, locale } =
  useComponentI18n<CreateConversationProjectLanguageSettingsTranslations>(
    createConversationProjectLanguageSettingsTranslations
  );
const { t: tControl } = useComponentI18n<NewConversationControlBarTranslations>(
  newConversationControlBarTranslations
);
const showProjectLanguageDialog = ref(false);
const showOverrideLanguagePicker = ref(false);
const returnToProjectLanguageDialog = ref(false);
const selectedProject = computed(() => props.project);

const forwardIcon = computed(() =>
  $q.lang.rtl ? "mdi-chevron-left" : "mdi-chevron-right"
);

const projectLanguageSummary = computed(() => {
  const project = selectedProject.value;
  if (project === undefined) {
    return undefined;
  }

  return formatProjectLanguageSettingsSummary({
    defaultLanguageCode: project.defaultLanguageCode,
    languageSettings: project.languageSettings,
    languageTranslateSuffix: tControl("languageTranslateSuffix"),
  });
});

const projectLanguageDetails = computed(() => {
  const project = selectedProject.value;
  if (project === undefined) {
    return undefined;
  }

  return getInheritedProjectLanguageCodes(project)
    .map((languageCode) =>
      getLanguageLabel({
        languageCode,
        locale: locale.value,
      })
    )
    .join(", ");
});

const overrideLanguageSummary = computed(() =>
  formatCompactLanguageSummary({
    primaryLanguage: tControl("languagePrimaryAuto"),
    multilingualSetting: overrideMultilingualSetting.value,
    canUseDynamicTranslation: true,
    languageTranslateSuffix: tControl("languageTranslateSuffix"),
  })
);

const overrideAutoLanguageCaption = computed(() => {
  const detectedLanguageCode = props.detectedLanguageCode;
  if (detectedLanguageCode === null || detectedLanguageCode === undefined) {
    return tLanguage("detectedLanguageAfterPublishing");
  }

  return tLanguage("autoDetectDetectedDescription", {
    language: getLanguageLabel({
      languageCode: detectedLanguageCode,
      locale: locale.value,
    }),
  });
});

const projectDynamicTranslationSummary = computed(() => {
  const project = selectedProject.value;
  if (project === undefined) {
    return undefined;
  }

  return project.languageSettings.dynamicTranslationEnabled
    ? tLanguage("dynamicTranslationOn")
    : tLanguage("dynamicTranslationOff");
});

const languageControlSummary = computed(() => {
  if (selectedProject.value !== undefined && inheritProjectLanguages.value) {
    return `${tProject("inheritSummaryPrefix")}: ${
      projectLanguageSummary.value ?? tProject("projectLanguagesFallback")
    }`;
  }

  if (selectedProject.value === undefined) {
    return overrideLanguageSummary.value;
  }

  return `${tProject("overrideSummaryPrefix")}: ${overrideLanguageSummary.value}`;
});

const languageControlLabel = computed(() =>
  formatLanguageControlLabel({
    languagesLabel: tControl("languagesLabel"),
    primaryLanguage: languageControlSummary.value,
    multilingualSetting: {
      additionalLanguageCodes: [],
      dynamicTranslationEnabled: false,
    },
    canUseDynamicTranslation: true,
    languageTranslateSuffix: tControl("languageTranslateSuffix"),
  })
);

const languagePickerMultilingualSetting = computed({
  get: () => overrideMultilingualSetting.value,
  set: (nextSetting: ConversationMultilingualSetting) => {
    overrideMultilingualSetting.value = nextSetting;
  },
});

function openProjectLanguageSettings(): void {
  if (selectedProject.value === undefined) {
    openOverrideLanguagePicker({ returnToProjectDialog: false });
    return;
  }

  showProjectLanguageDialog.value = true;
}

function openOverrideLanguagePicker({
  returnToProjectDialog,
}: {
  returnToProjectDialog: boolean;
}): void {
  returnToProjectLanguageDialog.value = returnToProjectDialog;
  showProjectLanguageDialog.value = false;
  showOverrideLanguagePicker.value = true;
}

function goBackFromOverrideLanguagePicker(): void {
  showOverrideLanguagePicker.value = false;
  showProjectLanguageDialog.value = returnToProjectLanguageDialog.value;
}

function setInheritProjectLanguages(value: boolean): void {
  if (!value) {
    copySelectedProjectSettingsToOverride();
  }
  inheritProjectLanguages.value = value;
}

function startDynamicTranslationOverride(value: boolean): void {
  copySelectedProjectSettingsToOverride();
  inheritProjectLanguages.value = false;
  setOverrideDynamicTranslation(value);
}

function setOverrideDynamicTranslation(value: boolean): void {
  overrideMultilingualSetting.value = setConversationDynamicTranslation({
    setting: overrideMultilingualSetting.value,
    enabled: value,
  });
}

function copySelectedProjectSettingsToOverride(): void {
  const project = selectedProject.value;
  if (project === undefined) {
    return;
  }

  overrideMultilingualSetting.value =
    projectLanguageSettingsToOverride(project);
}

function formatProjectLanguageSettingsSummary({
  defaultLanguageCode,
  languageSettings,
  languageTranslateSuffix,
}: {
  defaultLanguageCode: SupportedDisplayLanguageCodes;
  languageSettings: ProjectLanguageSettings;
  languageTranslateSuffix: string;
}): string {
  const inheritedLanguageCodes = getInheritedProjectLanguageCodes({
    defaultLanguageCode,
    languageSettings,
  });
  const [firstLanguageCode, ...extraLanguageCodes] = inheritedLanguageCodes;
  const translateSuffix = languageSettings.dynamicTranslationEnabled
    ? languageTranslateSuffix
    : "";

  const extraLanguageCount = extraLanguageCodes.length;
  const extraLanguageSuffix =
    extraLanguageCount === 0 ? "" : ` +${extraLanguageCount.toString()}`;

  return `${getLanguageLabel({
    languageCode: firstLanguageCode,
    locale: locale.value,
  })}${extraLanguageSuffix}${translateSuffix}`;
}

function getInheritedProjectLanguageCodes({
  defaultLanguageCode,
  languageSettings,
}: {
  defaultLanguageCode: SupportedDisplayLanguageCodes;
  languageSettings: ProjectLanguageSettings;
}): SupportedDisplayLanguageCodes[] {
  return [
    defaultLanguageCode,
    ...languageSettings.targetLanguageCodes.filter(
      (languageCode) => languageCode !== defaultLanguageCode
    ),
  ];
}

function projectLanguageSettingsToOverride({
  defaultLanguageCode,
  languageSettings,
}: ConversationProjectLanguageProject): ConversationMultilingualSetting {
  const detectedLanguageCode = props.detectedLanguageCode;
  const additionalLanguageCodes = getInheritedProjectLanguageCodes({
    defaultLanguageCode,
    languageSettings,
  })
    .filter((languageCode) => languageCode !== detectedLanguageCode)
    .slice(0, 2);

  return {
    additionalLanguageCodes,
    dynamicTranslationEnabled: languageSettings.dynamicTranslationEnabled,
  };
}
</script>

<style scoped lang="scss">
.language-settings-list {
  display: flex;
  gap: 0.75rem;
}

.project-language-settings {
  display: contents;
}

.language-settings-list {
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  background: white;
}
</style>
