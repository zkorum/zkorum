<template>
  <div>
    <AuthContentWrapper>
      <template #title> Enter the code </template>

      <template #body>
        <form class="formStyle" @submit.prevent="">
          <div class="instructions">
            Please enter the 6-digit code that was sent to
            <span class="emailAddress">{{ verificationEmailAddress }}</span
            >.
          </div>

          <div class="otpDiv">
            <div class="codeInput">
              <InputOtp v-model="verificationCode" :length="6" integer-only />
            </div>

            <div v-if="verificationCodeExpirySeconds != 0"
              class="weakColor codeExpiry"
            >
              Expires in {{ verificationCodeExpirySeconds }}s
            </div>

            <div v-if="verificationCodeExpirySeconds == 0"
              class="weakColor codeExpiry"
            >
              Code expired
            </div>
          </div>

          <ZKButton class="buttonStyle"
            label="Next"
            color="primary"
            :disabled="
              verificationCode.length != 6 || verificationCodeExpirySeconds == 0
            "
            type="submit"
            @click="emailVerification.submitCode(Number(verificationCode))"
          />

          <ZKButton class="buttonStyle"
            :label="
              verificationNextCodeSeconds > 0
                ? 'Resend Code in ' + verificationNextCodeSeconds + 's'
                : 'Resend Code'
            "
            color="secondary"
            :disabled="verificationNextCodeSeconds > 0"
            @click="requestCodeClicked(true)"
          />
        </form>
      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputOtp from "primevue/inputotp";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";
import { ApiV1AuthAuthenticatePost200Response } from "src/api";
import { useRouter } from "vue-router";
import { useDialog } from "src/utils/ui/dialog";
import { useEmailVerification } from "src/utils/auth/email/verification";

const { verificationEmailAddress, isAuthenticated } = storeToRefs(
  useAuthenticationStore()
);

const verificationCode = ref("");

const verificationNextCodeSeconds = ref(0);
const verificationCodeExpirySeconds = ref(0);

const router = useRouter();
const dialog = useDialog();

const emailVerification = useEmailVerification();

onMounted(() => {
  requestCodeClicked(false);
});

async function requestCodeClicked(isRequestingNewCode: boolean) {
  const response = await emailVerification.requestCode(
    isRequestingNewCode,
    verificationEmailAddress.value
  );

  if (response.isSuccessful) {
    processRequestCodeResponse(response.data);
  } else {
    if (response.error == "already_logged_in") {
      isAuthenticated.value = true;
      router.push({ name: "default-home-feed" });
    } else if (response.error == "throttled") {
      processRequestCodeResponse(response.data);
      dialog.showMessage(
        "Authentication",
        "Too many attempts. Please wait before requesting a new code"
      );
    } else {
      // no nothing
    }
  }
}

function processRequestCodeResponse(
  data: ApiV1AuthAuthenticatePost200Response | null
) {
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
    setTimeout(function () {
      decrementCodeExpiryTimer();
    }, 1000);
  }
}

function decrementNextCodeTimer() {
  verificationNextCodeSeconds.value -= 1;

  if (verificationNextCodeSeconds.value != 0) {
    setTimeout(function () {
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.buttonStyle {
  width: 100%;
}

.formStyle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.emailAddress {
  font-weight: bold;
}
</style>
