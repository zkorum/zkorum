<template>
  <NewConversationLayout v-slot="{ isActive }">
    <Teleport v-if="isActive" to="#page-header">
      <DefaultMenuBar :click-to-scroll-top="false">
        <template #left
          ><BackButton :fallback-route="detailsRoute" @click="handleBack"
        /></template>
        <template #right
          ><PrimeButton
            :label="editT('saveButton')"
            :loading="isSaving"
            :disabled="isSaveDisabled"
            @click="save"
        /></template>
      </DefaultMenuBar>
    </Teleport>

    <div v-if="session !== undefined" class="container">
      <ConversationTitle
        :is-private="session.form.isPrivate"
        :title="session.form.title"
        size="large"
        :conversation-type-config="session.form.conversationTypeConfig"
        :external-source-config="session.original.externalSourceConfig"
        :project-context="undefined"
        project-context-title-mode="original"
      />

      <section class="statement-section">
        <h2>{{ t("existingTitle") }}</h2>
        <p class="description">
          {{
            session.original.externalSourceConfig === null
              ? t("readOnlyDescription")
              : t("sourceManaged")
          }}
        </p>
        <p
          v-if="session.original.seedOpinions.length === 0"
          class="description"
        >
          {{ t("emptyExisting") }}
        </p>
        <ZKCard
          v-for="opinion in session.original.seedOpinions"
          :key="opinion.slugId"
          padding="1rem"
        >
          <ZKHtmlContent
            :html-body="opinion.content"
            :compact-mode="false"
            :enable-links="true"
            :collapsible="false"
          />
        </ZKCard>
      </section>

      <section
        v-if="session.original.canAddSeedOpinions"
        class="statement-section"
      >
        <h2>{{ t("newTitle") }}</h2>
        <SeedOpinionListEditor
          ref="seedEditor"
          v-model="newSeedOpinions"
          :existing-opinions="
            session.original.seedOpinions.map((opinion) => opinion.content)
          "
          :disabled="isSaving"
        />
      </section>
      <ZKCard
        v-else-if="session.original.externalSourceConfig === null"
        padding="1rem"
      >
        {{ editT("premiumEditRestrictedBanner") }}
      </ZKCard>
    </div>

    <EditConversationRouteGuard
      ref="routeGuard"
      :conversation-slug-id="conversationSlugId"
      :has-unsaved-changes="hasUnsavedChanges"
    />
  </NewConversationLayout>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import ConversationTitle from "src/components/features/conversation/ConversationTitle.vue";
import BackButton from "src/components/navigation/buttons/BackButton.vue";
import DefaultMenuBar from "src/components/navigation/header/DefaultMenuBar.vue";
import { conversationProjectEditTranslations } from "src/components/newConversation/conversationProjectEdit.i18n";
import EditConversationRouteGuard from "src/components/newConversation/EditConversationRouteGuard.vue";
import NewConversationLayout from "src/components/newConversation/NewConversationLayout.vue";
import SeedOpinionListEditor from "src/components/newConversation/SeedOpinionListEditor.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import ZKHtmlContent from "src/components/ui-library/ZKHtmlContent.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { UpdateConversationResponse } from "src/shared/types/dto";
import { buildEditConversationRequest, hasEditConversationDetailsChanges, useEditConversationStore } from "src/stores/editConversation";
import { useUpdateConversationMutation } from "src/utils/api/post/useConversationMutations";
import {
  isHistoryBackToPath,
  navigateBackOrReplace,
} from "src/utils/nav/historyBack";
import { getConversationEditReturnPath } from "src/utils/router/conversationEditReturn";
import { getSingleRouteParam } from "src/utils/router/params";
import { useNotify } from "src/utils/ui/notify";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { editConversationTranslations } from "../index.i18n";
import { editSeedOpinionsTranslations } from "./index.i18n";

defineOptions({ components: { PrimeButton: Button } });
const { t } = useComponentI18n(editSeedOpinionsTranslations);
const { t: editT } = useComponentI18n(editConversationTranslations);
const { t: projectT } = useComponentI18n(conversationProjectEditTranslations);
const route = useRoute();
const router = useRouter();
const conversationSlugId = computed(() => getSingleRouteParam(route.params.conversationSlugId));
const store = useEditConversationStore();
const { session: storedSession } = storeToRefs(store);
const session = computed(() =>
  storedSession.value?.original.conversationSlugId === conversationSlugId.value
    ? storedSession.value
    : undefined
);
const { showNotifyMessage } = useNotify();
const mutation = useUpdateConversationMutation();
const isSaving = computed(() => session.value?.isSaving ?? false);
const seedEditor = ref<InstanceType<typeof SeedOpinionListEditor>>();
const routeGuard = ref<InstanceType<typeof EditConversationRouteGuard>>();
const detailsRoute = computed(() => ({
  name: "/conversation/[conversationSlugId]/edit/" as const,
  params: { conversationSlugId: conversationSlugId.value },
  query: route.query,
}));
const newSeedOpinions = computed({
  get: () => session.value?.newSeedOpinions ?? [],
  set: (value: string[]) => {
    if (session.value !== undefined) session.value.newSeedOpinions = value;
  },
});
const hasUnsavedChanges = computed(
  () =>
    session.value !== undefined &&
    (hasEditConversationDetailsChanges(session.value) || session.value.newSeedOpinions.length > 0)
);
const isSaveDisabled = computed(
  () => isSaving.value || !hasUnsavedChanges.value
);

watch(conversationSlugId, async () => {
  if (session.value === undefined) {
    await router.replace({
      ...detailsRoute.value,
      query: { ...route.query, editStep: "seed" },
    });
  }
}, { immediate: true });

async function handleBack(event: MouseEvent): Promise<void> {
  event.preventDefault();
  if (isSaving.value) return;
  await navigateBackOrReplace({
    router,
    fallbackRoute: detailsRoute.value,
    shouldNavigateBack: isHistoryBackToPath({
      historyBack: window.history.state?.back,
      expectedPath: router.resolve(detailsRoute.value).fullPath,
    }),
  });
}

function showSaveFailure(
  response: Extract<UpdateConversationResponse, { success: false }>
): void {
  switch (response.reason) {
    case "project_not_available":
      showNotifyMessage(projectT("projectUnavailableError"));
      return;
    case "missing_project_capability":
      showNotifyMessage(projectT("projectPermissionError"));
      return;
    case "project_assignment_changed":
      showNotifyMessage(projectT("projectChangedError"));
      return;
    case "invalid_seed_opinion":
      seedEditor.value?.showFailure(response.seedOpinionFailure);
      return;
    case "not_found":
      showNotifyMessage(editT("notFoundError"));
      return;
    case "not_author":
      showNotifyMessage(editT("notAuthorError"));
      return;
    case "conversation_locked":
      showNotifyMessage(editT("conversationLockedError"));
      return;
    case "invalid_access_settings":
      showNotifyMessage(editT("invalidAccessSettingsError"));
      return;
    case "premium_access_expired":
      showNotifyMessage(editT("premiumAccessExpiredError"));
      return;
    case "premium_access_required":
      showNotifyMessage(editT("premiumAccessRequiredError"));
      return;
    case "feature_not_available":
    case "missing_participant_contact_email":
    case "active_delivery_conflict":
    case "seed_opinions_not_allowed":
    case "plain_text_too_long":
    case "html_too_long":
      showNotifyMessage(editT("updateError"));
  }
}

async function save(): Promise<void> {
  const current = session.value;
  if (current === undefined || isSaveDisabled.value) return;
  if (
    current.original.canAddSeedOpinions &&
    seedEditor.value?.validate() !== true
  )
    return;
  current.isSaving = true;
  try {
    const response = await mutation.mutateAsync({
      ...buildEditConversationRequest(current),
      newSeedOpinionList: [...current.newSeedOpinions],
    });
    if (session.value !== current) return;
    if (!response.success) {
      showSaveFailure(response);
      return;
    }
    showNotifyMessage(editT("updateSuccess"));
    routeGuard.value?.unlockRoute();
    store.clear();
    await router.push(
      getConversationEditReturnPath({
        conversationSlugId: current.original.conversationSlugId,
        returnTo: route.query.returnTo,
        projectAssignment: response.projectAssignment,
      })
    );
  } catch {
    if (session.value === current) showNotifyMessage(editT("updateError"));
  } finally {
    current.isSaving = false;
  }
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-block: 1rem 4rem;
}
.statement-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-medium);
}
.description {
  margin: 0;
  font-size: 0.9rem;
  color: $color-text-weak;
}
</style>
