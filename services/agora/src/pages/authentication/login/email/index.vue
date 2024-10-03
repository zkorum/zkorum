<template>
  <div>
    <form @submit.prevent="sendVerificationCode(verificationEmailAddress)">

      <AuthContentWrapper>

        <template #title>
          Enter your email
        </template>

        <template #body>

          <div>
            We will send you a 6-digit confirmation code to verify your email.
          </div>

          <div>
            <InputText v-model="verificationEmailAddress" type="email" placeholder="Email" required
              :style="{width: '100%'}" />
          </div>

          <ZKButton color="primary" label="Send Verification Code" type="submit" />

          <div class="agreementSection">
            By continuing, you are confirming that you have read and agree to our
            <RouterLink :to="{name: 'terms'}" class="highlightUrl" target="_blank">Terms of Use</RouterLink> and
            <RouterLink :to="{name: 'privacy'}" class="highlightUrl" target="_blank">Privacy Policy</RouterLink>.
          </div>

        </template>

      </AuthContentWrapper>

    </form>
  </div>

</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useRouter } from "vue-router";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputText from "primevue/inputtext";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";

const { verificationEmailAddress } = storeToRefs(useAuthenticationStore());

verificationEmailAddress.value = "";

const router = useRouter();

async function sendVerificationCode(email: string) {
  verificationEmailAddress.value = email;
  router.push({ name: "login-verify" });
}

</script>

<style scoped>
.agreementSection {
  font-size: 1rem;
}

.highlightUrl {
  text-decoration: underline;
}

</style>
