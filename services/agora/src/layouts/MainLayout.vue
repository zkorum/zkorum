<template>
  <div>
    <WidthWrapper :width="reducedWidth ? '25rem' : '35rem'">
      <q-layout view="hHh lpR fFf" :class="{ bottomPagePadding: addBottomPadding }">
        <TopMenuBar v-if="enableHeader" :has-back-button="props.headerHasGoBackButton"
          :has-settings-button="props.headerHasSettingsButton" />

        <q-page-container>
          <router-view />
        </q-page-container>

        <q-footer v-if="enableFooter" bordered class="coloredFooter">
          <q-tabs no-caps align="center" outside-arrows mobile-arrows active-color="brand" class="text-black">
            <q-route-tab :to="{ name: 'default-home-feed' }"
              :icon="currentRouteName === 'default-home-feed' ? 'mdi-newspaper' : 'mdi-newspaper'" />
            <q-route-tab :to="{ name: 'user-profile', params: { userId: 'TEST_USER_ID' } }"
              :icon="currentRouteName === 'user-profile' ? 'mdi-account-circle' : 'mdi-account-circle'" />
          </q-tabs>
        </q-footer>
      </q-layout>
    </WidthWrapper>
  </div>
</template>

<script setup lang="ts">
import TopMenuBar from "src/components/navigation/TopMenuBar.vue";
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import { MainLayoutProps } from "src/utils/model/props";
import { useRoute } from "vue-router";

const props = defineProps<MainLayoutProps>();

const route = useRoute();

const currentRouteName = route.name;

</script>

<style scoped lang="scss">
.outerPadding {
  padding: 0.5rem;
}

.coloredFooter {
  background-color: $navigation-bar-color;
}

.bottomPagePadding {
  padding-bottom: 10rem;
}
</style>
