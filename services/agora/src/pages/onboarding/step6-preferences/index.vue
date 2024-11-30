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
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
        </div>

        <div class="headerContainer">
          <q-icon name="mdi-pound" size="2rem" />
          Select topics to get started
        </div>

        <div class="tagContainer">
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
          <Tag value="New"></Tag>
        </div>

        <ZKButton label="Save and Close" color="primary" @click="skipEverything" />

      </template>

    </StepperLayout>
  </div>
</template>

<script setup lang="ts">
import { useSkipAuth } from "src/utils/auth/skipAuth";
import StepperLayout from "src/components/onboarding/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/InfoHeader.vue";
import Tag from "primevue/tag";
import ZKButton from "src/components/ui-library/ZKButton.vue";

const { skipEverything } = useSkipAuth();

</script>

<style scoped lang="scss">
.tagContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.headerContainer {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style>
