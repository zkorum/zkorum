<template>
  <div class="full-width full-height column flex-center" style="gap: 20px;">
    <h3 class="text-brand">{{ t("onboarding.login.title") }}</h3>
    <q-space />
    <ZKInputField v-model="email" type="email" :label="t('onboarding.login.email.label')"
      :hint="t('onboarding.login.email.hint')" hide-hint :rules="[(val: string) => isEmailValid(val) || emailHelper]"
      :onclick="handleAuthenticate" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ZKInputField from "@/components/ui-library/ZKInputField.vue";
import { zodauthorizedEmail, zodemail } from "@/shared/types/zod";
// import { authenticate } from "@/request/auth";
const { t } = useI18n()
const email = ref("")
const emailHelper = ref("")

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
