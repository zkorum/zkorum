<template>
  <div>
    <div class="container">
      <h4>Login Verification</h4>

      <div class="instructions">
        Please enter the verification code had been sent to the following email address:
      </div>

      <div class="emailStyle">
        {{ emailAddressLoaded }}
      </div>

      <div>
        <ZKInputField v-model="verificationCode" label="Verification Code" autocomplete="false" />
      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import { urlDecode } from "@/shared/common/base64";
import { useRouteParams } from "@vueuse/router";
import { ref } from "vue";
import ZKInputField from "@/components/ui-library/ZKInputField.vue";

const emailAddressLoaded = ref("FAILED TO LOAD EMAIL");
const emailAddressEncoded = useRouteParams("emailAddressEncoded")
if (typeof emailAddressEncoded.value == "string") {
  emailAddressLoaded.value = urlDecode(emailAddressEncoded.value);
}

const verificationCode = ref("");

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
  font-size: 1.2rem;
}

.emailStyle {
  font-size: 1.3rem;
  text-align: center;
  background-color: #e2e8f0;
  border-radius: 15px;
  padding: 1rem;
}
</style>
