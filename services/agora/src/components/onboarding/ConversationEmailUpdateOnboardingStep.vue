<template>
  <StepperLayout
    :submit-call-back="handleContinue"
    :current-step="1"
    :total-steps="1"
    :enable-next-button="!isSaving"
    :show-next-button="true"
    :show-loading-button="isSaving"
    :show-stepper="false"
  >
    <template #header>
      <InfoHeader
        :title="title"
        :description="description"
        icon-name="mdi-email-outline"
      />
    </template>

    <template #body>
      <ConversationUpdateOnboardingConsent
        v-if="showConversationUpdatesPreference"
        v-model="conversationUpdatesChecked"
        :scope-kind="scopeKind"
      />
      <ZKButton
        v-if="continueWithoutSavingLabel !== undefined"
        button-type="compactButton"
        flat
        color="primary"
        :label="continueWithoutSavingLabel"
        @click="emit('continueWithoutSaving')"
      />
    </template>
  </StepperLayout>
</template>

<script setup lang="ts">
import ConversationUpdateOnboardingConsent from "src/components/conversationUpdates/ConversationUpdateOnboardingConsent.vue";
import type { ConversationUpdateScopeSummary } from "src/components/conversationUpdates/conversationUpdateTypes";
import StepperLayout from "src/components/onboarding/layouts/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/ui/InfoHeader.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";

defineProps<{
  title: string;
  description: string;
  continueWithoutSavingLabel: string | undefined;
  showConversationUpdatesPreference: boolean;
  scopeKind: ConversationUpdateScopeSummary["kind"];
  isSaving: boolean;
}>();

const emit = defineEmits<{
  continue: [];
  continueWithoutSaving: [];
}>();

const conversationUpdatesChecked = defineModel<boolean>(
  "conversationUpdatesChecked",
  { required: true }
);

function handleContinue(): void {
  emit("continue");
}
</script>
