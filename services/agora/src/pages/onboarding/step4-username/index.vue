<template>
  <div>
    <StepperLayout :submit-call-back="goToNextRoute" :current-step="4" :total-steps="6"
      :enable-next-button="isValidUsername" :show-next-button="true">

      <template #header>
        <InfoHeader title="Choose your username" description="" icon-name="mdi-account-circle" />
      </template>

      <template #body>
        <div class="container">
          <div>
            How do you want to appear in Agora?
          </div>

          <q-input v-model="userName" label="Username" outlined :maxlength="MAX_LENGTH_USERNAME"
            :error="!isValidUsername" :error-message="userNameInvalidMessage">
            <template #append>
              <ZKButton v-if="isValidUsername" icon="mdi-check" text-color="red" />
              <ZKButton icon="mdi-dice-6" @click="refreshName()" />
            </template>

            <template #error>
              {{ validationMessage }}
            </template>
          </q-input>

        </div>

      </template>

    </StepperLayout>
  </div>
</template>

<script setup lang="ts">
import StepperLayout from "src/components/onboarding/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/InfoHeader.vue";
import { useRouter } from "vue-router";
import { ref, watch } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useBackendOnboardingApi } from "src/utils/api/onboarding";
import { generateRandomUsername } from "src/shared/services/account";
import { MAX_LENGTH_USERNAME } from "src/shared/shared";
import { zodUsername } from "src/shared/types/zod";
import { ZodError } from "zod";
import { useBackendAccountApi } from "src/utils/api/account";

const router = useRouter();

const userNameInvalidMessage = ref("");
const isValidUsername = ref(true);

const { isUsernameInUse } = useBackendOnboardingApi();
const { submitUsernameChange } = useBackendAccountApi();

const validationMessage = ref("");

const userName = ref(generateRandomUsername());

watch(userName, () => {
  nameContainsValidCharacters(userName.value);
})

async function nameContainsValidCharacters(value: string): Promise<boolean> {
  try {
    zodUsername.parse(value);

    const isInUse = await isUsernameInUse(value);
    if (isInUse) {
      isValidUsername.value = false;
      userNameInvalidMessage.value = "The entered username is currently in use"
      return false;
    } else {
      isValidUsername.value = true;
      return true;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      userNameInvalidMessage.value = error.format()._errors[0];
    }
    isValidUsername.value = false;
    return false;
  }
}

function refreshName() {
  userName.value = generateRandomUsername();
}

async function goToNextRoute() {
  const isSuccessful = await submitUsernameChange(userName.value);
  if (isSuccessful) {
    router.push({ name: "onboarding-step5-experience" });
  } else {
    userName.value = "";
  }
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.popoverText {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 20rem;
}
</style>
