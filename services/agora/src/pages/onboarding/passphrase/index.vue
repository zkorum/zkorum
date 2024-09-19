<template>
  <div>
    <OnboardContent>

      <template #title>
        Enter the code
      </template>

      <template #body>
        <div class="instructions">
          Please enter the 6-digit code that we sent to {{ emailAddressLoaded }}
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

        <ZKButton label="Skip Verification Page" color="black" @click="submitBypass()" />
      </template>
    </OnboardContent>
  </div>
</template>

<script setup lang="ts">
import { urlDecode } from "src/shared/common/base64";
import { useRouteParams } from "@vueuse/router";
import { ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import OnboardContent from "src/components/onboarding/OnboardContent.vue";
import { useRouter } from "vue-router";
import InputOtp from "primevue/inputotp";

const router = useRouter();

const resendCodeCooldownMessage = ref("");

const emailAddressLoaded = ref("FAILED TO LOAD EMAIL");
const emailAddressEncoded = useRouteParams("emailAddressEncoded");
if (typeof emailAddressEncoded.value == "string") {
  emailAddressLoaded.value = urlDecode(emailAddressEncoded.value);
}

const verificationCode = ref("");

let verificationTimeLeftSeconds = ref(0);

function submitCode(verificationCode: string) {
  console.log(verificationCode);
  router.push({ name: "default-home-feed" });
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
  router.push({ name: "default-home-feed" });
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
