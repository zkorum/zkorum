<template>
  <ZKButton outline label="Verify" text-color="color-text-strong" @click="skipButton()" />
</template>

<script setup lang="ts">
import { useAuthenticationStore } from "src/stores/authentication";
import { usePhoneVerification } from "src/utils/auth/email/verification";
import { useRouter } from "vue-router";
import ZKButton from "../ui-library/ZKButton.vue";

const router = useRouter();
const {
  isAuthenticated,
  verificationPhoneNumber,
  verificationDefaultCallingCode,
} = useAuthenticationStore();
const phoneVerification = usePhoneVerification();

async function skipButton() {
  verificationPhoneNumber.value = "+33612345678";
  verificationDefaultCallingCode.value = "33";

  const requestCodeResponse = await phoneVerification.requestCode({
    isRequestingNewCode: false,
    phoneNumber: verificationPhoneNumber.value,
    defaultCallingCode: verificationDefaultCallingCode.value,
  });
  if (requestCodeResponse.isSuccessful) {
    await phoneVerification.submitCode(0);
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
