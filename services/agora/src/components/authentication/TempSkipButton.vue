<template>
  <ZKButton outline label="Verify" text-color="color-text-strong" @click="skipButton()" />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { useEmailVerification } from "src/utils/auth/email/verification";
import { useRouter } from "vue-router";
import ZKButton from "../ui-library/ZKButton.vue";

const router = useRouter();
const { isAuthenticated } = storeToRefs(useAuthenticationStore());
const emailVerificaton = useEmailVerification();

async function skipButton() {
  const requestCodeResponse = await emailVerificaton.requestCode(false, "test@gmail.com");
  if (requestCodeResponse.isSuccessful) {
    await emailVerificaton.submitCode(0, "test@gmail.com");
    isAuthenticated.value = true;
    router.push({ name: "verification-successful" });
  } else {
    console.log("Failed to request code");
    console.log(requestCodeResponse.error);
  }

}

</script>

