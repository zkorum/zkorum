<template>
  <PersistentLayout v-if="isDrawerLayout">
    <router-view v-slot="{ Component }" :route="route">
      <keep-alive :include="keepAliveRoutes">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </PersistentLayout>
  <router-view v-else :route="route" />
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import PersistentLayout from "src/layouts/PersistentLayout.vue";
import { shouldUseDrawerLayout } from "src/utils/router/appLayout";
import { computed, provide } from "vue";
import {
  routeLocationKey,
  type RouteLocationNormalizedLoaded,
} from "vue-router";

const props = defineProps<{ route: RouteLocationNormalizedLoaded }>();
const keepAliveRoutes = ["HomePage", "NotificationPage", "UserProfilePage"];
const isDrawerLayout = computed(() => shouldUseDrawerLayout(props.route.name));

// RouterView's route prop selects components, but useRoute also needs this
// framework injection so the background stays on its own route beneath a sheet.
provide(routeLocationKey, toReactive(computed(() => props.route)));
</script>
