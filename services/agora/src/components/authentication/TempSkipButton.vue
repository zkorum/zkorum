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
const { isAuthenticated, verificationEmailAddress } = storeToRefs(useAuthenticationStore());
const emailVerificaton = useEmailVerification();

async function skipButton() {
  verificationEmailAddress.value = "test@gmail.com";

  const requestCodeResponse = await emailVerificaton.requestCode(false, verificationEmailAddress.value);
  if (requestCodeResponse.isSuccessful) {
    await emailVerificaton.submitCode(0);
    isAuthenticated.value = true;
    router.push({ name: "verification-successful" });
  } else {
    console.log("Failed to request code");
    if (requestCodeResponse.error == "already_logged_in") {
      isAuthenticated.value = true;
      router.push({ name: "verification-successful" });
    } else if (requestCodeResponse.error == "throttled") {
      console.log("Throttled please try again later");
    }
  }

}

</script>

