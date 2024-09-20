<template>
  <div>
    <form @submit.prevent="sendVerificationCode()">

      <AuthContentWrapper>

        <template #title>
          Enter your email
        </template>

        <template #body>

          <div>
            We will send you a 6-digit confirmation code to verify your email.
          </div>

          <div>
            <InputText v-model="emailInput" type="email" placeholder="Email" required :style="{width: '100%'}"/>
          </div>

          <ZKButton color="primary" label="Send Verification Code" type="submit" />

          <div class="agreementSection">
            By continuing, you are confirming that you have read and agree to our
            <a href="https://zkorum.com/" target="_blank">User Agreement</a> and
            <a href="https://zkorum.com/" target="_blank">Privacy Policy</a>.
          </div>

          <ZKButton label="Skip Email Page" color="black"
            @click="router.push({ name: 'login-passphrase', params: { emailAddressEncoded: urlEncode('testing-email@gmail.com') } })" />
        </template>

      </AuthContentWrapper>

    </form>
  </div>

</template>

<script setup lang="ts">
import { ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useRouter } from "vue-router";
import { urlEncode } from "src/shared/common/base64";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputText from "primevue/inputtext";

const emailInput = ref("");

const router = useRouter();

function sendVerificationCode() {
  console.log("Submit hit");
  router.push({ name: "login-passphrase", params: { emailAddressEncoded: urlEncode(emailInput.value) } });
}

</script>

<style scoped>
.agreementSection {
  font-size: 1rem;
}
</style>
