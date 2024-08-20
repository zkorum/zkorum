<template>
  <div class="window-width window-height column flex-center" style="gap: 20px; background-color: #4BE7DE;">
    <q-img src="agora.png" class="welcomeImage" />
    <div class="buttonFlex">
      <ZKButton :label="t('welcome.login')" :to="{ name: 'login' }" />
      <ZKButton color-flex="black" @click="skipAuthentication()" label="Skip Authentication" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/authentication";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
const { t } = useI18n()

const router = useRouter();

function skipAuthentication() {
  useAuthenticationStore().isAuthenticated = true;
  router.push({ name: "default-home-feed" });
}

/*
function isDevMode() {
  if (process.env.DEV) {
    return true;
  } else {
    return false;
  }
}
  */

</script>

<style scoped>
.buttonFlex {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>

<style scoped>
.welcomeImage {
  width: min(100%, 30rem);
}
</style>
