<template>
  <ConversationControlButton
    :label="languageControlLabel"
    :icon="
      showProjectLanguageDialog ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
    "
    @click="openProjectLanguageSettings"
  />

  <q-dialog v-model="showProjectLanguageDialog" position="bottom">
    <ZKBottomDialogContainer
      :title="tLanguage('languagesTitle')"
      :subtitle="tProject('projectLanguagesDescription')"
    >
      <div class="language-settings-list">
        <ConversationLanguageSettingsRow
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

        <template v-if="inheritProjectLanguages">
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
                :disable="
                  !props.canUseDynamicTranslation &&
                  !selectedProject.languageSettings.dynamicTranslationEnabled
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
            @click="openOverrideLanguagePicker"
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
                :disable="
                  !props.canUseDynamicTranslation &&
                  !overrideMultilingualSetting.dynamicTranslationEnabled
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
    :can-edit-languages="props.canUseDynamicTranslation"
    :show-auto-language="true"
    :auto-language-caption="overrideAutoLanguageCaption"
    :detected-language-code="props.detectedLanguageCode"
    :subtitle="
      pendingLanguageOverride === undefined
        ? undefined
        : tProjectEdit('chooseCustomLanguagesDescription')
    "
    @back="goBackFromOverrideLanguagePicker"
  >
    <template v-if="pendingLanguageOverride !== undefined" #actions>
      <q-btn
        flat
        no-caps
        :label="tProjectEdit('primaryLanguageOnly')"
        @click="usePrimaryLanguageOnly"
      />
    </template>
  </ConversationAdditionalLanguagesDialog>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import ConversationControlButton from "src/components/newConversation/ConversationControlButton.vue";
import { conversationProjectSettingsTranslations } from "src/components/newConversation/ConversationProjectSettings.i18n";
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
import type { ConversationMultilingualSetting } from "src/shared/types/zod";
import { setConversationDynamicTranslation } from "src/utils/translation/conversationMultilingualSetting";
import { computed, ref, watch } from "vue";

import {
  formatCompactLanguageSummary,
  formatLanguageControlLabel,
} from "./conversationLanguageControlLabel";
import { conversationProjectEditTranslations } from "./conversationProjectEdit.i18n";
import {
  type ConversationLanguageProject,
  getInheritedProjectLanguageCodes,
  getProjectLanguageOverride,
} from "./conversationProjectLanguage";

const props = defineProps<{
  project: ConversationLanguageProject;
  canUseDynamicTranslation: boolean;
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
const { t: tProject, locale } = useComponentI18n(
  conversationProjectSettingsTranslations
);
const { t: tProjectEdit } = useComponentI18n(
  conversationProjectEditTranslations
);
const { t: tControl } = useComponentI18n<NewConversationControlBarTranslations>(
  newConversationControlBarTranslations
);
const showProjectLanguageDialog = ref(false);
const showOverrideLanguagePicker = ref(false);
const pendingLanguageOverride = ref<ConversationMultilingualSetting>();
watch(showOverrideLanguagePicker, (visible) => {
  if (!visible) pendingLanguageOverride.value = undefined;
});
watch(
  () => props.project.projectSlug,
  () => {
    showProjectLanguageDialog.value = false;
    showOverrideLanguagePicker.value = false;
    pendingLanguageOverride.value = undefined;
  }
);
const selectedProject = computed(() => props.project);

const forwardIcon = computed(() =>
  $q.lang.rtl ? "mdi-chevron-left" : "mdi-chevron-right"
);

const projectLanguageSummary = computed(() => {
  const [first, ...additionalLanguageCodes] = getInheritedProjectLanguageCodes(
    props.project
  );
  return formatCompactLanguageSummary({
    primaryLanguage: getLanguageLabel({
      languageCode: first,
      locale: locale.value,
    }),
    multilingualSetting: {
      additionalLanguageCodes,
      dynamicTranslationEnabled:
        props.project.languageSettings.dynamicTranslationEnabled,
    },
    canUseDynamicTranslation: true,
    languageTranslateSuffix: tControl("languageTranslateSuffix"),
  });
});

const projectLanguageDetails = computed(() => {
  const project = selectedProject.value;
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
    canUseDynamicTranslation: props.canUseDynamicTranslation,
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
  return project.languageSettings.dynamicTranslationEnabled
    ? tLanguage("dynamicTranslationOn")
    : tLanguage("dynamicTranslationOff");
});

const languageControlSummary = computed(() => {
  return inheritProjectLanguages.value
    ? tProject("inheritSummary", { languages: projectLanguageSummary.value })
    : tProject("overrideSummary", { languages: overrideLanguageSummary.value });
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
  get: () => pendingLanguageOverride.value ?? overrideMultilingualSetting.value,
  set: (nextSetting: ConversationMultilingualSetting) => {
    overrideMultilingualSetting.value = nextSetting;
    inheritProjectLanguages.value = false;
    pendingLanguageOverride.value = undefined;
  },
});

function openProjectLanguageSettings(): void {
  showProjectLanguageDialog.value = true;
}

function openOverrideLanguagePicker(): void {
  showProjectLanguageDialog.value = false;
  showOverrideLanguagePicker.value = true;
}

function goBackFromOverrideLanguagePicker(): void {
  pendingLanguageOverride.value = undefined;
  showOverrideLanguagePicker.value = false;
  showProjectLanguageDialog.value = true;
}

function setInheritProjectLanguages(value: boolean): void {
  if (!value) {
    switchToOverride(
      selectedProject.value.languageSettings.dynamicTranslationEnabled
    );
    return;
  }
  inheritProjectLanguages.value = value;
}

function startDynamicTranslationOverride(value: boolean): void {
  if (value && !props.canUseDynamicTranslation) return;
  switchToOverride(value);
}

function setOverrideDynamicTranslation(value: boolean): void {
  if (value && !props.canUseDynamicTranslation) return;
  overrideMultilingualSetting.value = setConversationDynamicTranslation({
    setting: overrideMultilingualSetting.value,
    enabled: value,
  });
}

function switchToOverride(dynamicTranslationEnabled: boolean): void {
  const result = getProjectLanguageOverride({
    project: props.project,
    detectedLanguageCode: props.detectedLanguageCode,
    dynamicTranslationEnabled,
  });
  if (result.success) {
    overrideMultilingualSetting.value = result.data;
    inheritProjectLanguages.value = false;
    return;
  }
  pendingLanguageOverride.value = {
    additionalLanguageCodes: [],
    dynamicTranslationEnabled,
  };
  openOverrideLanguagePicker();
}
function usePrimaryLanguageOnly(): void {
  const setting = pendingLanguageOverride.value;
  if (setting === undefined) return;
  languagePickerMultilingualSetting.value = setting;
  goBackFromOverrideLanguagePicker();
}
</script>

<style scoped lang="scss">
.language-settings-list {
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  background: white;
}
</style>
