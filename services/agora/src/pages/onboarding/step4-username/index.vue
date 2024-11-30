<template>
  <div>
    <StepperLayout :submit-call-back="goToNextRoute" :current-step="4" :total-steps="6"
      :enable-next-button="userName.length > 0" :show-next-button="true">

      <template #header>
        <InfoHeader title="Choose your username" :description="description" icon-name="mdi-account-circle" />
      </template>

      <template #body>
        <div class="container">
          <div>
            How do you want to appear in Agora?
          </div>

          <q-input v-model="userName" outlined :placeholder="placeholder">
            <template #append>
              <ZKButton icon="mdi-dice-6" @click="generateRandomName()" />
            </template>
          </q-input>

          <div class="optionBar">
            <div class="lightMessage">
              Appear as `anonymous' by default
            </div>

            <ToggleSwitch v-model="checkedAnonymous" />

            <ZKButton icon="mdi-information-outline" text-color="color-text-weak" @click="infoToggle" />
            <Popover ref="infoButtonPopover">
              <div class="popoverText">
                <div>
                  <b>Appear as anonymous</b>
                </div>

                We protect your privacy by default. If you would rather not show your username, this toggle ensures that
                any posts, responses or comments are displayed as ‘anonymous’.
              </div>

            </Popover>

          </div>

        </div>

      </template>

    </StepperLayout>
  </div>
</template>

<script setup lang="ts">
import StepperLayout from "src/components/onboarding/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/InfoHeader.vue";
import ToggleSwitch from "primevue/toggleswitch";
import { useRouter } from "vue-router";
import { ref, watch } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import Popover from "primevue/popover";

const router = useRouter();

const description = "";

const userName = ref("");
const checkedAnonymous = ref(false);

const infoButtonPopover = ref();
const infoToggle = (event) => {
  infoButtonPopover.value.toggle(event);
}

const placeholder = ref("RandomGenerated1234");

watch(checkedAnonymous, () => {

})

function generateRandomName() {
  console.log("?");
}

function goToNextRoute() {
  router.push({ name: "onboarding-step5-experience" });
}

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lightMessage {
  color: $color-text-weak;
  width: 15rem;
}

.optionBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.popoverText {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 20rem;
}
</style>
