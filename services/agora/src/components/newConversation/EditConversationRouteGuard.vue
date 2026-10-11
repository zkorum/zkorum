<template>
  <ZKConfirmDialog
    v-model="showExitDialog"
    :message="t('message')"
    :actions="{
      cancel: { label: t('cancel'), appearance: 'secondary-outlined' },
      confirm: { label: t('discard'), appearance: 'danger' },
    }"
    @confirm="discard"
  />
</template>

<script setup lang="ts">
import ZKConfirmDialog from "src/components/ui-library/ZKConfirmDialog.vue";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import { useEditConversationStore } from "src/stores/editConversation";
import {
  type RouteGuardDestination,
  useRouteGuard,
} from "src/utils/component/routing/routeGuard";
import { getSingleRouteParam } from "src/utils/router/params";
import { onMounted, watch } from "vue";
import { onBeforeRouteUpdate } from "vue-router";

import { editConversationRouteGuardTranslations } from "./EditConversationRouteGuard.i18n";

const props = defineProps<{
  conversationSlugId: string;
  hasUnsavedChanges: boolean;
  navigationPending: boolean;
}>();
const store = useEditConversationStore();
const { t } = useComponentI18n(editConversationRouteGuardTranslations);

function allowDestination(to: RouteGuardDestination): boolean | "block" {
  if (props.navigationPending) return "block";
  if (
    typeof to.name === "string" &&
    to.name.startsWith("/conversation/[conversationSlugId]/edit/") &&
    getSingleRouteParam(to.params.conversationSlugId) ===
      props.conversationSlugId
  )
    return true;
  if (props.hasUnsavedChanges || store.hasUnsavedChanges) return false;
  store.clear();
  return true;
}

const {
  showExitDialog,
  lockRoute,
  unlockRoute,
  proceedWithNavigation,
  guardNavigation,
} = useRouteGuard(() => props.hasUnsavedChanges, allowDestination);
onMounted(lockRoute);
watch(() => props.conversationSlugId, lockRoute);
onBeforeRouteUpdate((to, from) =>
  guardNavigation({ to, fromPath: from.fullPath })
);

async function discard(): Promise<void> {
  await proceedWithNavigation(store.clear);
}
defineExpose({ unlockRoute });
</script>
