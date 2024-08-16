<template>
  <div class="window-width window-height column flex-center" style="gap: 20px; background-color: #4BE7DE;">
    <q-img src="afterwork.png" style="width: 336px; height: 390px;" />
    <div class="buttonFlex">
      <ZKButton :btnProps="{ to: '/onboarding/login' }">{{ t("welcome.login") }}</ZKButton>
      <ZKButton v-if="isDevMode()" @click="skipAuthentication()">Skip Authentication</ZKButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/authentication";
import ZKButton from "views/ZKButton.vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
const { t } = useI18n()

const router = useRouter();

function skipAuthentication() {
  useAuthenticationStore().isAuthenticated = true;
  router.push({ name: "home-screen" });
}

function isDevMode() {
  if (process.env.DEV) {
    return true;
  } else {
    return false;
  }
}

</script>

<style scoped>
.buttonFlex {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
