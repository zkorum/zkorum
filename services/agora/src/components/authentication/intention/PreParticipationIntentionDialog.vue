<template>
  <div>
    <DialogContainer
      v-model="showDialog"
      :title="t('title')"
      :message="t('message')"
      :show-cancel-dialog="true"
      :ok-callback="okButtonClicked"
      :cancel-callback="() => {}"
      :label-ok="t('labelOk')"
      :label-cancel="t('labelCancel')"
      :ok-loading="false"
    >
      <template #body>
        <div v-if="subMessage" class="shadowBoxStyle">
          <div class="iconAlignment">
            <q-icon name="mdi-information" size="1.2rem" />
          </div>
          <div>
            {{ subMessage }}
          </div>
        </div>
      </template>
    </DialogContainer>
  </div>
</template>

<script setup lang="ts">
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { PossibleIntentions } from "src/stores/loginIntention";
import { useLoginIntentionStore } from "src/stores/loginIntention";
import { computed } from "vue";
import { useRouter } from "vue-router";

import DialogContainer from "./DialogContainer.vue";
import {
  type PreParticipationIntentionDialogTranslations,
  preParticipationIntentionDialogTranslations,
} from "./PreParticipationIntentionDialog.i18n";

const props = defineProps<{
  okCallback: () => void;
  activeIntention: PossibleIntentions;
}>();

const showDialog = defineModel<boolean>({ required: true });

const { t } = useComponentI18n<PreParticipationIntentionDialogTranslations>(
  preParticipationIntentionDialogTranslations
);

const { setActiveUserIntention } = useLoginIntentionStore();

const subMessage = computed(() =>
  props.activeIntention === "newConversation"
    ? t("subMessageConversationDraft")
    : undefined
);

const router = useRouter();

async function okButtonClicked() {
  props.okCallback();
  setActiveUserIntention(props.activeIntention);
  await router.push({ name: "/welcome/" });
}
</script>

<style scoped lang="scss">
.shadowBoxStyle {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 1rem;
  padding: 0.5rem;
  color: $primary;
}

.iconAlignment {
  margin: auto;
}
</style>
