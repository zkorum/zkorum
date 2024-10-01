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
            <RouterLink :to="{name: 'terms'}" class="highlightUrl">Terms of Use</RouterLink> and
            <RouterLink :to="{name: 'privacy'}" class="highlightUrl">Privacy Policy</RouterLink>.
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
import { useBackendAuthApi } from "src/utils/api/auth";
import { useQuasar } from "quasar";
import { getPlatform } from "src/utils/common";
import { useDialog } from "src/utils/ui/dialog";

const { verificationEmailAddress } = storeToRefs(useAuthenticationStore());

const { emailLogin } = useBackendAuthApi();

verificationEmailAddress.value = "";

const router = useRouter();
const diaglog = useDialog();

const quasar = useQuasar();

async function sendVerificationCode(email: string) {

  if (process.env.DEV) {
    email = "test@gmail.com";
    verificationEmailAddress.value = email;
  }

  const response = await emailLogin(email, false, getPlatform(quasar.platform));
  if (response.isSuccessful) {
    router.push({ name: "login-verify" });
  } else {
    if (response.error == "already_logged_in") {
      diaglog.showMessage("Authentication", "User is already logged in");
    } else if (response.error == "throttled") {
      diaglog.showMessage("Authentication", "Too many attempts. Please wait before attempting to login again");
    }
  }
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
