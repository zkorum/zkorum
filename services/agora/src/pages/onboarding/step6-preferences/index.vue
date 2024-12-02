<template>
  <div>
    <StepperLayout :submit-call-back="() => { }" :current-step="6" :total-steps="6" :enable-next-button="true"
      :show-next-button="false">

      <template #header>
        <InfoHeader title="Content Preferences" description="" icon-name="mdi-star-box" />
      </template>

      <template #body>
        <div class="headerContainer">
          <q-icon name="mdi-translate" size="2rem" />
          What languages do you speak?
        </div>

        <div class="tagContainer">
          <div v-for="lang in languageList" :key="lang" class="tagWrapper">
            <q-btn outline no-caps :label="lang" class="tagStyle" rounded size="small" text-color="primary"
              icon="mdi-close" />
          </div>
          <q-btn round outline no-caps color="secondary" icon="mdi-plus" />
        </div>

        <div class="headerContainer">
          <q-icon name="mdi-pound" size="2rem" />
          Select topics to get started
        </div>

        <div class="tagContainer">
          <q-btn v-for="topic in topicList" :key="topic" outline no-caps :label="topic" class="tagStyle" rounded
            size="small" text-color="primary" />
        </div>

        <ZKButton label="Save and Close" color="primary" @click="goToHome" />

      </template>

    </StepperLayout>
  </div>
</template>

<script setup lang="ts">
import StepperLayout from "src/components/onboarding/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/InfoHeader.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useRouter } from "vue-router";

const router = useRouter();

const languageList = ["English", "Spanish", "French", "Chinese"];
const topicList = ["Technology", "Environment", "Politics"]

function goToHome() {
  router.push({ name: "default-home-feed" });
}

</script>

<style scoped lang="scss">
.tagContainer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.headerContainer {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.tagStyle:hover {
  cursor: pointer;
}

.tagWrapper {
  position: relative;
}

.closeButton {
  position: absolute;
  top: 0px;
  right: 0px;
}
</style>
