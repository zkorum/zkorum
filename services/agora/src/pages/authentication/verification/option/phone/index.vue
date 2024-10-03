<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Phone Verification
      </template>
      <template #body>

        <div class="container">
          <InputText v-model="phoneNumber" placeholder="Phone number" />

          <SkipForLaterButton @click="skipButton()" />
        </div>

      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import SkipForLaterButton from "src/components/authentication/SkipForLaterButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputText from "primevue/inputtext";
import { ref } from "vue";

const router = useRouter();

const phoneNumber = ref("");

function skipButton() {
  router.push({ name: "default-home-feed" });
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

</style>
