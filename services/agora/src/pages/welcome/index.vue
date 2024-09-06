<template>
  <div class="container">
    <q-img src="/images/onboarding/brand.webp" class="welcomeImage" />
    <div class="buttonFlex">
      <ZKButton :label="t('welcome.login')" :to="{ name: 'login' }" />
      <ZKButton color-flex="black" @click="skipAuthentication()" label="Skip Authentication" />
    </div>
  </div>

</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useAuthenticationStore } from "src/stores/authentication";
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

.welcomeImage {
  width: min(15rem, 100%);
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  height: 100vh;
  background-image: url('/images/onboarding/background.webp');
  background-size: cover;
}
</style>
