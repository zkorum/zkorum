<template>
  <TopMenuWrapper :reveal="true">
    <div class="topMenu">
      <div class="menuButtons">
        <BackButton v-if="hasBackButton" />
      </div>
      <div class="menuButtons">
        <RouterLink :to="{ name: 'welcome'}">
          <ZKButton label="Login" text-color="white" color="warning" />
        </RouterLink>

        <HelpButton />
        <RouterLink :to="{ name: 'settings-page' }">
          <ZKButton v-if="hasSettingsButton" icon="mdi-cog" text-color="color-text-strong" flat />
        </RouterLink>
      </div>
    </div>
  </TopMenuWrapper>
</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
import TopMenuWrapper from "./TopMenuWrapper.vue";
import HelpButton from "./buttons/HelpButton.vue";
import BackButton from "./buttons/BackButton.vue";

defineProps<{
  hasBackButton: boolean
  hasSettingsButton: boolean
}>();

</script>

<style scoped style="scss">
.menuButtons {
  display: flex;
  gap: 0.8rem;
}

.topMenu {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
