<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Phone Verification
      </template>
      <template #body>

        <form class="formStyle" @submit.prevent="">
          <div class="instructions">
            Please enter the 6-digit code that was sent to <span class="phoneNumberStyle">{{ verificationNumber
              }}</span>.
          </div>

          <div class="otpDiv">
            <div class="codeInput">
              <InputOtp v-model="verificationCode" :length="6" integer-only />
            </div>

            <div v-if="verificationCodeExpirySeconds != 0" class="weakColor codeExpiry">
              Expires in {{ verificationCodeExpirySeconds }}s
            </div>

            <div v-if="verificationCodeExpirySeconds != 0" class="weakColor codeExpiry">
              Code expired
            </div>
          </div>

          <!--
          <ZKButton class="buttonStyle" label="Next" color="primary"
            :disabled="verificationCode.length != 6 || verificationCodeExpirySeconds == 0" type="submit"
             />

          <ZKButton class="buttonStyle"
            :label="verificationNextCodeSeconds > 0 ? 'Resend Code in ' + verificationNextCodeSeconds + 's' : 'Resend Code'"
            color="secondary" :disabled="verificationNextCodeSeconds > 0"/>
          -->

          <TempSkipButton />

        </form>

      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import { phoneVerificationStore } from "src/stores/verification/phone";
import { ref } from "vue";
import InputOtp from "primevue/inputotp";
import TempSkipButton from "src/components/authentication/TempSkipButton.vue";

const { verificationNumber } = storeToRefs(phoneVerificationStore());

const verificationCode = ref("");

// const verificationNextCodeSeconds = ref(0);
const verificationCodeExpirySeconds = ref(0);

</script>

<style scoped lang="scss">
.formStyle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.instructions {
  font-size: 1.1rem;
}

.phoneNumberStyle {
  font-weight: bold;
}

.otpDiv {
  display:flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
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

</style>
