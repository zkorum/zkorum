<template>
  <div>
    <div class="container">
      <div v-if="isAuthenticated">
        <SettingsSection :settings-item-list="accountSettings" title="Account" />
      </div>

      <SettingsSection :settings-item-list="aboutSettings" title="About" />

      <div v-if="isAuthenticated">
        <SettingsSection :settings-item-list="supportSettings" title="Support" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SettingsSection from "src/components/settings/SettingsSection.vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { useBackendAuthApi } from "src/utils/api/auth";
import { type SettingsInterface } from "src/utils/component/settings/settings";
import { useRouter } from "vue-router";

const { isAuthenticated } = useAuthenticationStore();

const { userLogout } = useAuthenticationStore();

const backendAuth = useBackendAuthApi();
const router = useRouter();

function logoutRequested() {
  backendAuth.logout();
  userLogout();
  router.push({ name: "onboarding-step1-signup" });
}

const accountSettings: SettingsInterface[] = [
  /*
  {
    icon: "mdi-passport",
    label: "Account verification",
    action: () => { },
    routeName: "verification-options"
  },
  */
  {
    icon: "mdi-logout",
    label: "Log out",
    action: logoutRequested,
    routeName: "welcome",
  },
];

const aboutSettings: SettingsInterface[] = [
  {
    icon: "mdi-key",
    label: "Privacy policy",
    action: () => { },
    routeName: "privacy",
  },
  {
    icon: "mdi-file-document",
    label: "Terms of service",
    action: () => { },
    routeName: "terms",
  },
];

const supportSettings: SettingsInterface[] = [
  {
    icon: "mdi-delete",
    label: "Delete Account",
    action: () => { },
    routeName: "",
  },
];
</script>

<style scoped lang="scss">
.container {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 2rem;
}
</style>
