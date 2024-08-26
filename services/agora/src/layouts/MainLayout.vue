<template>
  <q-layout view="hHh lpR fFf">
    <q-header :reveal="true" bordered class="menuStyle" height-hint="98">
      <q-toolbar class="content-between" style="width: 100%">
        <div style="width: 100%">
          <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat v-if="props.hasGoBackButton"
            @click="router.back()" />
        </div>
        <div class="menuButtons">
          <ZKButton icon="mdi-cog" text-color-flex="black" flat />
          <ZKButton icon="mdi-help" text-color-flex="black" flat />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="container">
      <router-view />
    </q-page-container>

    <q-footer bordered class="menuStyle">
      <q-tabs no-caps align="center" outside-arrows mobile-arrows active-color="brand" class="text-black">
        <q-route-tab :to="{ name: 'default-home-feed' }"
          :icon="currentRouteName === 'default-home-feed' ? 'mdi-newspaper' : 'mdi-newspaper'" />
        <q-route-tab :to="{ name: 'community-explore' }"
          :icon="currentRouteName === 'community-explore' ? 'mdi-account-group' : 'mdi-account-group'" />
        <!--
        <q-route-tab :to="{ name: 'notifications' }"
          :icon="currentRouteName === 'notifications' ? 'mdi-bell' : 'mdi-bell'" />
        -->
        <q-route-tab :to="{ name: 'user-profile', params: { userId: 'TEST_USER_ID' } }"
          :icon="currentRouteName === 'user-profile' ? 'mdi-account-circle' : 'mdi-account-circle'" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import ZKButton from "@/components/ui-library/ZKButton.vue";
import { MainLayoutProps } from "@/utils/model/props";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<MainLayoutProps>()

const route = useRoute();
const router = useRouter();

const currentRouteName = route.name;

</script>

<style scoped>
.menuButtons {
  display: flex;
  gap: 0.5rem;
}

.container {
  max-width: min(50rem, 100%);
  margin: auto;
  padding: 0.5rem;
}

.menuStyle {
  background-color: #fafafa;
}
</style>