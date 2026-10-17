<template>
  <ZKCheckbox
    v-model="checked"
    :label="checkboxLabel"
    :description="undefined"
    :required="false"
    :disabled="false"
  >
    <template #description>
      <strong class="email-guarantee">{{ t("emailGuarantee") }}</strong>
      {{ checkboxDescription }}
    </template>
  </ZKCheckbox>
</template>

<script setup lang="ts">
import ZKCheckbox from "src/components/ui-library/ZKCheckbox.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { computed } from "vue";

import {
  type ConversationUpdateOnboardingConsentTranslations,
  conversationUpdateOnboardingConsentTranslations,
} from "./ConversationUpdateOnboardingConsent.i18n";
import type { ConversationUpdateScopeSummary } from "./conversationUpdateTypes";

const props = defineProps<{
  scopeKind: ConversationUpdateScopeSummary["kind"];
}>();

const checked = defineModel<boolean>({ required: true });

const { t } = useComponentI18n<ConversationUpdateOnboardingConsentTranslations>(
  conversationUpdateOnboardingConsentTranslations
);

const checkboxLabel = computed(() =>
  props.scopeKind === "project" ? t("projectLabel") : t("conversationLabel")
);
const checkboxDescription = computed(() =>
  props.scopeKind === "project"
    ? t("projectDescription")
    : t("conversationDescription")
);
</script>

<style scoped lang="scss">
.email-guarantee {
  display: block;
  margin-block-end: 0.25rem;
  color: $grey-9;
}
</style>
