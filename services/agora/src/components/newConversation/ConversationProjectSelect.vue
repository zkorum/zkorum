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
        :model-value="selectedValue"
        :options="selectOptions"
        :label="t('projectLabel')"
        searchable
        @update:model-value="selectTarget"
      />
    </ZKBottomDialogContainer>
  </q-dialog>
</template>

<script setup lang="ts" generic="T">
import ConversationControlButton from "src/components/newConversation/ConversationControlButton.vue";
import {
  type CreateConversationProjectLanguageSettingsTranslations,
  createConversationProjectLanguageSettingsTranslations,
} from "src/components/newConversation/CreateConversationProjectLanguageSettings.i18n";
import ZKBottomDialogContainer from "src/components/ui-library/ZKBottomDialogContainer.vue";
import ZKSelect from "src/components/ui-library/ZKSelect.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { computed, ref } from "vue";

const props = defineProps<{
  options: readonly {
    value: string;
    title: string | undefined;
    noProject: boolean;
    target: T;
  }[];
  selectedValue: string;
  selectedLabel: string | undefined;
}>();
const emit = defineEmits<{ select: [target: T] }>();
const { t } =
  useComponentI18n<CreateConversationProjectLanguageSettingsTranslations>(
    createConversationProjectLanguageSettingsTranslations
  );
const showDialog = ref(false);
const selectOptions = computed(() =>
  props.options.map(({ value, title, noProject }) => ({
    value,
    label: noProject
      ? title === undefined
        ? t("noProjectLabel")
        : `${t("noProjectLabel")} · ${title}`
      : (title ?? t("projectLabel")),
  }))
);
const controlLabel = computed(
  () =>
    selectOptions.value.find((option) => option.value === props.selectedValue)
      ?.label ??
    props.selectedLabel ??
    t("noProjectLabel")
);

function selectTarget(value: string | string[] | null): void {
  if (typeof value !== "string") return;
  const option = props.options.find((option) => option.value === value);
  if (option === undefined) return;
  emit("select", option.target);
  showDialog.value = false;
}
</script>
