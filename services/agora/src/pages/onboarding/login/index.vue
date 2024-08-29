<template>
  <div>
    <form @submit.prevent="sendVerificationCode()" class="container">
      <h4>{{ t("onboarding.login.title") }}</h4>
      <div>
        Email Address

        <ZKInputField v-model="emailInput" type="email" hide-hint
          :rules="[(val: string) => isEmailValid(val) || emailHelper]" />
      </div>

      <div class="acceptanceDiv">
        <q-checkbox v-model="stayLoggedIn" />
        <div>
          This is not a shared device. Stay logged in.
        </div>
      </div>

      <ZKButton label="Send Verification Code" :disabled="emailInput.length == 0" type="submit"
        :onclick="handleAuthenticate" />

      <div>
        By continuing, you are confirming that you have read and agree to our
        <a href="https://zkorum.com/" target="_blank">User Agreement</a> and
        <a href="https://zkorum.com/" target="_blank">Privacy Policy</a>.
      </div>

      <ZKButton label="Skip Email Page" color-flex="black"
        @click="router.push({ name: 'passphrase', params: { emailAddressEncoded: urlEncode('testing-email@gmail.com') } })" />

    </form>
  </div>

</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ZKInputField from "@/components/ui-library/ZKInputField.vue";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import { zodauthorizedEmail, zodemail } from "@/shared/types/zod";
import { useRouter } from "vue-router";
import { urlEncode } from "@/shared/common/base64";

// import { authenticate } from "@/request/auth";
const { t } = useI18n()
const emailInput = ref("")
const emailHelper = ref("")

const stayLoggedIn = ref(false);

const router = useRouter();

function sendVerificationCode() {
  console.log("Submit hit");
  router.push({ name: "passphrase" });
}

function handleAuthenticate() {
  // await authenticate(email, false, )
}

function isEmailValid(emailToValidate: string): boolean {
  if (emailToValidate === "") {
    // setIsEmailValid("incorrect");
    emailHelper.value = ""
    return false;
  }
  const result = zodemail.safeParse(emailToValidate);
  if (!result.success) {
    // const formatted = result.error.format();
    // emailHelper.value = formatted._errors[0]; // TODO: translate this
    emailHelper.value = t("onboarding.login.email.invalid")
    return false;
  } else {
    const result = zodauthorizedEmail.safeParse(emailToValidate);
    if (!result.success) {
      emailHelper.value = t("onboarding.login.email.unauthorized")
      return false;
    } else {
      emailHelper.value = ""
      return true;
    }
  }
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.acceptanceDiv {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style>
