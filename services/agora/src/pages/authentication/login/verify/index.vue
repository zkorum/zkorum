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
          @click="submitCode(verificationCode)" />

        <ZKButton label="Resend Code" color="secondary" :disabled="verificationTimeLeftSeconds > 0"
          @click="resendCode()" />

        <div>
          {{ resendCodeCooldownMessage }}
        </div>

        <ZKButton label="Skip Passphrase Page" color="black" @click="submitBypass()" />
      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import { useRouter } from "vue-router";
import InputOtp from "primevue/inputotp";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";

const router = useRouter();

const { verificationEmailAddress } = storeToRefs(useAuthenticationStore());

const resendCodeCooldownMessage = ref("");

const verificationCode = ref("");

let verificationTimeLeftSeconds = ref(0);

onUnmounted(() => {
  verificationEmailAddress.value = "";
});

function submitCode(verificationCode: string) {
  console.log(verificationCode);
  router.push({ name: "verification-welcome" });
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


function submitBypass() {
  router.push({ name: "verification-welcome" });
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
