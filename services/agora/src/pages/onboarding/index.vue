<template>
  <div>
    <BokehEffect>
      <div class="container">
        <q-img src="agora.png" class="welcomeImage" />
        <div class="buttonFlex">
          <ZKButton :label="t('welcome.login')" :to="{ name: 'login' }" />
          <ZKButton color-flex="black" @click="skipAuthentication()" label="Skip Authentication" />
        </div>
      </div>
    </BokehEffect>
  </div>

</template>

<script setup lang="ts">
import { useAuthenticationStore } from "@/stores/authentication";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import BokehEffect from "@/components/backgrounds/BokehEffect.vue";
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
  width: min(20rem, 100%);
  border-radius: 15px;
  opacity: 0.8;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  height: 100%;
}
</style>
