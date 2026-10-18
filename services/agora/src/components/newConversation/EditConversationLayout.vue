<template>
  <NewConversationLayout v-slot="{ isActive }">
    <Teleport v-if="isActive" to="#page-header">
      <DefaultMenuBar :click-to-scroll-top="false">
        <template #left>
          <BackButton :fallback-route="fallbackRoute" />
        </template>
        <template #right>
          <slot name="actions" />
        </template>
      </DefaultMenuBar>
    </Teleport>

    <PageLoadingSpinner v-if="isLoading" />
    <slot v-else />
    <slot name="dialogs" />

    <EditConversationRouteGuard
      ref="routeGuard"
      :conversation-slug-id="conversationSlugId"
      :has-unsaved-changes="hasUnsavedChanges"
      :navigation-pending="navigationPending"
    />
  </NewConversationLayout>
</template>

<script setup lang="ts">
import BackButton from "src/components/navigation/buttons/BackButton.vue";
import DefaultMenuBar from "src/components/navigation/header/DefaultMenuBar.vue";
import PageLoadingSpinner from "src/components/ui/PageLoadingSpinner.vue";
import { ref } from "vue";
import type { RouteLocationRaw } from "vue-router";

import EditConversationRouteGuard from "./EditConversationRouteGuard.vue";
import NewConversationLayout from "./NewConversationLayout.vue";

defineProps<{
  conversationSlugId: string;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  navigationPending: boolean;
  fallbackRoute: RouteLocationRaw;
}>();

const routeGuard = ref<InstanceType<typeof EditConversationRouteGuard>>();

function unlockRoute(): void {
  routeGuard.value?.unlockRoute();
}

defineExpose({ unlockRoute });
</script>
