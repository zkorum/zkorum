<template>
  <div>
    <form @submit.prevent="sendVerificationCode()">

      <OnboardContent>

        <template #title>
          Enter your email
        </template>

        <template #body>

          <div>
            We will send you a 6-digit confirmation code to verify your email
          </div>

          <div>
            <ZKInputField v-model="emailInput" type="email" label="Email" required />
          </div>

          <div class="acceptanceDiv">
            <q-checkbox v-model="stayLoggedIn" label="This is not a shared device. Stay logged in." />
          </div>

          <ZKButton color="primary" label="Send Verification Code" type="submit" />

          <div class="agreementSection">
            By continuing, you are confirming that you have read and agree to our
            <a href="https://zkorum.com/" target="_blank">User Agreement</a> and
            <a href="https://zkorum.com/" target="_blank">Privacy Policy</a>.
          </div>

          <ZKButton label="Skip Email Page" color="black"
            @click="router.push({ name: 'passphrase', params: { emailAddressEncoded: urlEncode('testing-email@gmail.com') } })" />
        </template>

      </OnboardContent>

    </form>
  </div>

</template>

<script setup lang="ts">
import { ref } from "vue";
import ZKInputField from "src/components/ui-library/ZKInputField.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useRouter } from "vue-router";
import { urlEncode } from "src/shared/common/base64";
import OnboardContent from "src/components/onboarding/OnboardContent.vue";

const emailInput = ref("");

const stayLoggedIn = ref(false);

const router = useRouter();

function sendVerificationCode() {
  console.log("Submit hit");
  router.push({ name: "passphrase", params: { emailAddressEncoded: urlEncode(emailInput.value) } });
}

</script>

<style scoped>
.acceptanceDiv {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.agreementSection {
  font-size: 0.9rem;
}
</style>
