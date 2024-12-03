<template>
  <div class="container">
    <img src="/feed/images/onboarding/brand.webp" class="welcomeImage" />
    <div class="buttonFlex">
      <ZKButton label="Sign Up" :to="{ name: 'onboarding-step1-signup' }" color="primary" />

      <ZKButton label="Log In" :to="{ name: 'onboarding-step1-login' }" color="white" text-color="primary" />

      <ZKButton color="black" label="Skip Authentication" @click="skipAuthentication()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { usePostStore } from "src/stores/post";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const { resetPostData } = usePostStore();

onMounted(() => {
  resetPostData();
})

function skipAuthentication() {
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
  width: min(15rem, 100%);
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
  background-image: url("/feed/images/onboarding/background.webp");
  background-size: cover;
}
</style>
