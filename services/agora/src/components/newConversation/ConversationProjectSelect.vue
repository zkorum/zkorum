<template>
  <ConversationControlButton
    :label="controlLabel"
    :icon="showDialog ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
    @click="showDialog = true"
  />
  <q-dialog v-model="showDialog" position="bottom">
    <ZKBottomDialogContainer
      :title="t('projectLabel')"
      :subtitle="t('projectSelectionDescription')"
    >
      <ZKSelect
        :model-value="getConversationProjectTargetKey(props.modelValue)"
        :options="selectOptions"
        :label="t('projectLabel')"
        searchable
        @update:model-value="selectTarget"
      />
    </ZKBottomDialogContainer>
  </q-dialog>
</template>

<script setup lang="ts">
import ConversationControlButton from "src/components/newConversation/ConversationControlButton.vue";
import { conversationProjectSettingsTranslations } from "src/components/newConversation/ConversationProjectSettings.i18n";
import ZKBottomDialogContainer from "src/components/ui-library/ZKBottomDialogContainer.vue";
import ZKSelect from "src/components/ui-library/ZKSelect.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { ConversationProjectTarget } from "src/shared/types/zod";
import { getConversationProjectTargetKey } from "src/shared/utils/conversationProject";
import { computed, ref } from "vue";

import type { ConversationProjectSelectOption } from "./conversationProjectSelect";

const props = defineProps<{
  options: readonly ConversationProjectSelectOption[];
  modelValue: ConversationProjectTarget;
  fallbackLabel: string | undefined;
}>();
const emit = defineEmits<{
  "update:modelValue": [target: ConversationProjectTarget];
}>();
const { t } = useComponentI18n(conversationProjectSettingsTranslations);
const showDialog = ref(false);
const selectOptions = computed(() =>
  props.options.map((option) => ({
    value: getConversationProjectTargetKey(option.target),
    label: "title" in option ? option.title : t("noProjectLabel"),
  }))
);
const controlLabel = computed(() =>
  props.modelValue.kind === "no_project"
    ? t("noProjectLabel")
    : (selectOptions.value.find(
        (option) =>
          option.value === getConversationProjectTargetKey(props.modelValue)
      )?.label ??
      props.fallbackLabel ??
      props.modelValue.projectSlug)
);

function selectTarget(value: string | string[] | null): void {
  if (typeof value !== "string") return;
  const option = props.options.find(
    (option) => getConversationProjectTargetKey(option.target) === value
  );
  if (option === undefined) return;
  emit("update:modelValue", option.target);
  showDialog.value = false;
}
</script>
