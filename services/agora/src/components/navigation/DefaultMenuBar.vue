<template>
  <TopMenuWrapper :reveal="true">
    <div class="menuButtons">
      <BackButton v-if="hasBackButton" />

      <RouterLink :to="{ name: 'default-home-feed' }">
        <ZKButton v-if="hasCloseButton" icon="mdi-close" text-color="color-text-strong" flat />
      </RouterLink>

    </div>

    <div class="menuButtons">
      <RouterLink v-if="hasLoginButton" :to="{ name: 'welcome' }">
        <ZKButton label="Login" text-color="white" color="warning" />
      </RouterLink>

      <HelpButton />
      <RouterLink :to="{ name: 'settings-page' }">
        <ZKButton v-if="hasSettingsButton" icon="mdi-cog" text-color="color-text-strong" flat />
      </RouterLink>
    </div>
  </TopMenuWrapper>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
import HelpButton from "./buttons/HelpButton.vue";
import BackButton from "./buttons/BackButton.vue";
import { DefaultMenuBarProps } from "src/utils/model/props";
import TopMenuWrapper from "./TopMenuWrapper.vue";

defineProps<DefaultMenuBarProps>();

</script>

<style scoped style="scss">
.menuButtons {
  display: flex;
  gap: 0.8rem;
}

</style>
