<template>
  <div class="seed-editor">
    <p class="shortcut-hint">{{ t("addStatementShortcut") }}</p>
    <div v-for="item in items" :key="item.id" class="seed-item">
      <SeedOpinionItem
        :ref="(el) => setItemRef({ el, id: item.id })"
        :model-value="item.content"
        :error-message="errors[item.id]"
        :is-active="activeId === item.id"
        :disabled="disabled"
        @update:model-value="(content) => updateItem({ id: item.id, content })"
        @focus="activeId = item.id"
        @blur="activeId = undefined"
        @add-next="addItem"
        @remove="removeItem(item.id)"
      />
    </div>
    <div v-if="!disabled" class="add-row">
      <ConversationControlButton
        v-if="items.length < MAX_SEED_OPINIONS_PER_SUBMISSION"
        :label="t('addOpinion')"
        icon="pi pi-plus"
        :show-border="false"
        icon-position="left"
        @click="addItem"
      />
      <span>{{ items.length }}/{{ MAX_SEED_OPINIONS_PER_SUBMISSION }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { MAX_SEED_OPINIONS_PER_SUBMISSION } from "src/shared/seedOpinions";
import type { SeedOpinionValidationFailure } from "src/shared/types/dto";
import { validateSeedOpinionAdditions } from "src/shared/utils/seedOpinions";
import { type ComponentPublicInstance, nextTick, ref, watch } from "vue";

import ConversationControlButton from "./ConversationControlButton.vue";
import SeedOpinionItem from "./SeedOpinionItem.vue";
import { seedOpinionsTranslations } from "./SeedOpinions.i18n";

const props = defineProps<{
  modelValue: string[];
  existingOpinions: readonly string[];
  disabled: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();
const { t } = useComponentI18n(seedOpinionsTranslations);
let nextItemId = 0;
const items = ref(props.modelValue.map(createItem));
const errors = ref<Record<string, string | undefined>>({});
const activeId = ref<string>();
type FocusableOpinion = ComponentPublicInstance & { focus: () => void };
const itemRefs = new Map<string, FocusableOpinion>();

function createItem(content: string) {
  const id = String(nextItemId++);
  return { id, content };
}

watch(
  () => props.modelValue,
  (contents) => {
    if (
      contents.length === items.value.length &&
      contents.every(
        (content, index) => content === items.value[index]?.content
      )
    )
      return;
    items.value = contents.map(createItem);
    errors.value = {};
  },
  { deep: true }
);

function syncItems(): void {
  emit(
    "update:modelValue",
    items.value.map((item) => item.content)
  );
}

function updateItem({ id, content }: { id: string; content: string }): void {
  const item = items.value.find((item) => item.id === id);
  if (props.disabled || item === undefined) return;
  item.content = content;
  errors.value = {};
  syncItems();
}

function isFocusableOpinion(
  el: Element | ComponentPublicInstance
): el is FocusableOpinion {
  return "focus" in el && typeof el.focus === "function" && "$el" in el;
}

function setItemRef({
  el,
  id,
}: {
  el: Element | ComponentPublicInstance | null;
  id: string;
}): void {
  if (el !== null && isFocusableOpinion(el)) itemRefs.set(id, el);
  else itemRefs.delete(id);
}

async function focusItem(id: string): Promise<void> {
  await nextTick();
  const item = itemRefs.get(id);
  const element: unknown = item?.$el;
  if (element instanceof HTMLElement)
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  item?.focus();
}

async function addItem(): Promise<void> {
  if (props.disabled || items.value.length >= MAX_SEED_OPINIONS_PER_SUBMISSION)
    return;
  const item = createItem("");
  items.value.push(item);
  syncItems();
  await focusItem(item.id);
}

function removeItem(id: string): void {
  if (props.disabled) return;
  items.value = items.value.filter((item) => item.id !== id);
  itemRefs.delete(id);
  errors.value = {};
  syncItems();
}

function getFailureMessage(failure: SeedOpinionValidationFailure): string {
  switch (failure.reason) {
    case "duplicate":
      return t("opinionDuplicate");
    case "plain_text_empty":
      return t("opinionCannotBeEmpty");
    case "html_too_long":
      return t("opinionHtmlTooLong");
    case "plain_text_too_long":
      return t("opinionExceedsLimit", {
        limit: failure.limit,
        count: failure.count,
      });
  }
}

function showFailure(failure: SeedOpinionValidationFailure): void {
  const item = items.value[failure.index];
  if (item === undefined) return;
  errors.value[item.id] = getFailureMessage(failure);
  void focusItem(item.id);
}

function validate(): boolean {
  errors.value = {};
  const failures = validateSeedOpinionAdditions({
    opinions: items.value.map((item) => item.content),
    existingOpinions: props.existingOpinions,
  });
  for (const failure of failures) {
    const item = items.value[failure.index];
    if (item !== undefined) errors.value[item.id] = getFailureMessage(failure);
  }
  const firstFailure = failures.at(0);
  if (firstFailure !== undefined) {
    const item = items.value[firstFailure.index];
    if (item !== undefined) void focusItem(item.id);
  }
  return failures.length === 0;
}

defineExpose({ validate, showFailure });
</script>

<style scoped lang="scss">
.seed-editor,
.seed-item {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.shortcut-hint {
  margin: 0;
  color: $color-text-weak;
  font-size: 0.85rem;
}
.add-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $color-text-weak;
}
</style>
