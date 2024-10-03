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

        <div class="otpDiv">
          <div class="codeInput">
            <InputOtp v-model="verificationCode" :length="6" integer-only />
          </div>

          <div v-if="verificationCodeExpirySeconds != 0" class="weakColor codeExpiry">
            Expires in {{ verificationCodeExpirySeconds }} seconds
          </div>

          <div v-if="verificationCodeExpirySeconds == 0" class="weakColor codeExpiry">
            Code expired
          </div>
        </div>

        <ZKButton label="Next" color="primary" :disabled="verificationCode.length != 6 || verificationCodeExpirySeconds == 0"
          @click="submitCode(Number(verificationCode))" />

        <ZKButton label="Resend Code" color="secondary" :disabled="verificationNextCodeSeconds > 0"
          @click="requestCode(true)" />

        <div v-if="verificationNextCodeSeconds > 0" class="weakColor">
          You can request a new code in {{ verificationNextCodeSeconds }} seconds.
        </div>
      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import { useRouter } from "vue-router";
import InputOtp from "primevue/inputotp";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";
import { useBackendAuthApi } from "src/utils/api/auth";
import { useQuasar } from "quasar";
import { getPlatform } from "src/utils/common";
import { useDialog } from "src/utils/ui/dialog";
import { ApiV1AuthAuthenticatePost200Response } from "src/api";

const router = useRouter();

const { verificationEmailAddress, isAuthenticated } = storeToRefs(useAuthenticationStore());

const { emailCode, sendEmailCode } = useBackendAuthApi();

const verificationCode = ref("");

const dialog = useDialog();

const $q = useQuasar();

const verificationNextCodeSeconds = ref(0);
const verificationCodeExpirySeconds = ref(0);

onMounted(() => {
  requestCode(false);
});

async function submitCode(code: number) {

  if (process.env.USE_DUMMY_ACCESS == "true") {
    code = 0;
  }

  const response = await emailCode(verificationEmailAddress.value, code, getPlatform($q.platform));
  if (response.data.success) {
    isAuthenticated.value = true;
    router.push({ name: "verification-welcome" });
  } else {
    console.log("Failed");
  }
}

async function requestCode(isRequestingNewCode: boolean) {

  const response = await sendEmailCode(verificationEmailAddress.value, isRequestingNewCode, getPlatform($q.platform));
  if (response.isSuccessful) {
    processRequestCodeResponse(response.data);
  } else {
    if (response.error == "already_logged_in") {
      isAuthenticated.value = true;
      dialog.showMessage("Authentication", "User is already logged in");
      router.push({ name: "default-home-feed" });
    } else if (response.error == "throttled") {
      processRequestCodeResponse(response.data);
      dialog.showMessage("Authentication", "Too many attempts. Please wait before requesting a new code");
    } else {
      // no nothing
    }
  }
}

function processRequestCodeResponse(data: ApiV1AuthAuthenticatePost200Response | null) {

  if (data == null) {
    console.log("Null data from request code response");
    return;
  }

  {
    const nextCodeSoonestTime = new Date(data.nextCodeSoonestTime);
    const now = new Date();

    const diff = nextCodeSoonestTime.getTime() - now.getTime();
    const nextCodeSecondsWait = Math.round(diff / 1000);

    verificationNextCodeSeconds.value = nextCodeSecondsWait;
    decrementNextCodeTimer();
  }

  {
    const codeExpiryTime = new Date(data.codeExpiry);
    const now = new Date();

    const diff = codeExpiryTime.getTime() - now.getTime();
    const codeExpirySeconds = Math.round(diff / 1000);

    verificationCodeExpirySeconds.value = codeExpirySeconds;
    decrementCodeExpiryTimer();
  }
}

function decrementCodeExpiryTimer() {
  verificationCodeExpirySeconds.value -= 1;

  if (verificationCodeExpirySeconds.value != 0) {
    setTimeout(
      function () {
        decrementCodeExpiryTimer();
      }, 1000);
  }
}

function decrementNextCodeTimer() {
  verificationNextCodeSeconds.value -= 1;

  if (verificationNextCodeSeconds.value != 0) {
    setTimeout(
      function () {
        decrementNextCodeTimer();
      }, 1000);
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

<style scoped lang="scss">
.instructions {
  font-size: 1.1rem;
}

.codeInput {
  display: flex;
  justify-content: center;
}

.weakColor {
  color: $color-text-weak;
}

.codeExpiry {
  text-align: center;
}

.otpDiv {
  display:flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

</style>
