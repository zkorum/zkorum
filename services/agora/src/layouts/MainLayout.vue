<template>
  <div>
    <WidthWrapper :width="reducedWidth ? '25rem' : '35rem'">
      <q-layout view="hHh lpR fFf" :class="{ bottomPagePadding: addBottomPadding }">

        <router-view v-if="enableHeader" name="topmenubar" />

        <q-page-container>
          <router-view />
        </q-page-container>

        <q-footer v-if="enableFooter" bordered class="coloredFooter flexIcons">
          <RouterLink :to="{ name: 'default-home-feed'}">
            <div class="iconStyle">
              <q-icon name="mdi-home" size="1.6rem" :color="route.name === 'default-home-feed' ? 'primary' : 'black'" />
              <div :class="'text-' + (route.name === 'default-home-feed' ? 'primary' : 'black')">
                Home
              </div>
            </div>

          </RouterLink>

          <RouterLink v-if="authenticationStore.isAuthenticated" :to="{ name: 'user-profile' }">
            <div class="iconStyle">
              <q-icon name="mdi-account-circle" size="1.6rem"
                :color="route.name === 'user-profile' ? 'primary' : 'black'" />
              <div :class="'text-' + (route.name === 'user-profile' ? 'primary' : 'black')">
                Profile
              </div>
            </div>
          </RouterLink>

        </q-footer>
      </q-layout>
    </WidthWrapper>
  </div>
</template>

<script setup lang="ts">
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { MainLayoutProps } from "src/utils/model/props";
import { useRoute } from "vue-router";

const authenticationStore = useAuthenticationStore();

defineProps<MainLayoutProps>();

const route = useRoute();

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

.flexIcons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.iconStyle {
  padding: 0.3rem;
  cursor: pointer;
  display:flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.7rem;
  font-weight: bold;
}

</style>
