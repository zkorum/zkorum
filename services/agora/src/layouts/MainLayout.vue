<template>
  <div>
    <WidthWrapper>
      <q-layout view="hHh lpR fFf" :class="{ bottomPagePadding: addBottomPadding, outerPadding: addOuterPadding }">
        <TopMenuBar :has-back-button="props.headerHasGoBackButton" :has-settings-button="props.headerHasSettingsButton"
          v-if="enableHeader" />

        <q-page-container>
          <router-view />
        </q-page-container>

        <q-footer bordered :class="{ coloredFooter: !useStylelessFooter, stylelessFooter: useStylelessFooter }"
          v-if="enableFooter">
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
    </WidthWrapper>
  </div>
</template>

<script setup lang="ts">
import TopMenuBar from "@/components/navigation/TopMenuBar.vue";
import WidthWrapper from "@/components/navigation/WidthWrapper.vue";
import { MainLayoutProps } from "@/utils/model/props";
import { useRoute } from "vue-router";

const props = defineProps<MainLayoutProps>()

const route = useRoute();

const currentRouteName = route.name;

</script>

<style scoped>
.outerPadding {
  padding: 0.5rem;
}

.coloredFooter {
  background-color: #fafafa;
}

.stylelessFooter {
  background-color: #ffffff;
}

.bottomPagePadding {
  padding-bottom: 10rem;
}
</style>