<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Account Verification
      </template>
      <template #body>

        <div class="container">

          <div>
            A verified account is required to participate in the
            community.
          </div>

          <VerificationOption title="Passport" description="More private way to verify your identity"
            icon="mdi-card-account-details" route-name="verification-option-passport" />

          <VerificationOption title="Phone Number" description="More convenient way to verify your identity"
            icon="mdi-phone" route-name="verification-option-phone-number" />

          <SkipForLaterButton @click="skipButton()" />
        </div>

      </template>
    </AuthContentWrapper>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import SkipForLaterButton from "src/components/authentication/SkipForLaterButton.vue";
import VerificationOption from "src/components/verification/VerificationOption.vue";

const router = useRouter();

function skipButton() {
  router.push({ name: "default-home-feed" });
}

</script>

<style scoped lang="scss">
.container {
  display:flex;
  flex-direction: column;
  gap: 2rem;
}

</style>
