<template>
  <div>
    <AuthContentWrapper>

      <template #title>
        Enter the code
      </template>

      <template #body>
        <div class="instructions">
          Please enter the 6-digit code that we sent to {{ verificationEmailAddress }}
        </div>

        <div class="codeInput">
          <InputOtp v-model="verificationCode" :length="6" />
        </div>

        <ZKButton label="Next" color="primary" :disabled="verificationCode.length != 6"
          @click="submitCode(Number(verificationCode))" />

        <ZKButton label="Resend Code" color="secondary" :disabled="verificationTimeLeftSeconds > 0"
          @click="resendCode()" />

        <div>
          {{ resendCodeCooldownMessage }}
        </div>

        <ZKButton label="Skip Passphrase Page" color="black" @click="submitCode(0)" />
      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import { useRouter } from "vue-router";
import InputOtp from "primevue/inputotp";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";
import { useBackendAuthApi } from "src/utils/api/auth";
import { useQuasar } from "quasar";
import { getPlatform } from "src/utils/common";

const router = useRouter();

const { verificationEmailAddress, isAuthenticated } = storeToRefs(useAuthenticationStore());

const { emailCode } = useBackendAuthApi();

const resendCodeCooldownMessage = ref("");

const verificationCode = ref("");

const $q = useQuasar();

let verificationTimeLeftSeconds = ref(0);

/*
onUnmounted(() => {
  verificationEmailAddress.value = "";
});
*/

async function submitCode(code: number) {
  console.log(code);
  const response = await emailCode(verificationEmailAddress.value, code, getPlatform($q.platform));
  console.log(response.data);
  if (response.data.success) {
    isAuthenticated.value = true;
    router.push({ name: "verification-welcome" });
  } else {
    console.log("Failed");
  }
}

function resendCode() {
  verificationTimeLeftSeconds.value = 10;
  decrementTimer();
}

function decrementTimer() {
  verificationTimeLeftSeconds.value -= 1;
  resendCodeCooldownMessage.value = "The new code had been sent. You may retry in " + verificationTimeLeftSeconds.value + " seconds.";

  if (verificationTimeLeftSeconds.value != 0) {
    setTimeout(
      function () {
        decrementTimer();
      }, 1000);
  } else {
    resendCodeCooldownMessage.value = "";
  }
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>

<style scoped>
.instructions {
  font-size: 1.1rem;
}

.codeInput {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

</style>
