<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Create an account
      </template>
      <template #body>

        <div class="container">

          <div>
            User verification is required to participate in the
            community.
          </div>

          <VerificationOption v-for="option in optionList" :key="option.icon" :title="option.title" :description="option.description"
            :icon="option.icon" :route-name="option.routeName" />
        </div>

      </template>
    </AuthContentWrapper>

  </div>
</template>

<script setup lang="ts">
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import VerificationOption from "src/components/verification/VerificationOption.vue";

interface VerificationOptions {
  title: string;
  description: string;
  icon: string;
  routeName: string;
}

const optionList: VerificationOptions[] = [
  {
    title: "Go Incognito",
    description: "Scan your passport in RariMe powered by ZKP cryptography",
    icon: "mdi-card-account-details",
    routeName: "verification-option-passport"
  },
  {
    title: "Phone Number",
    description: "Verify using your mobile phone",
    icon: "mdi-phone",
    routeName: "verification-option-phone-number"
  }
];

</script>

<style scoped lang="scss">
.container {
  display:flex;
  flex-direction: column;
  gap: 2rem;
}

</style>
