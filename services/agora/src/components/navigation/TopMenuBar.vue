<template>
  <TopMenuWrapper :reveal="true">
    <div class="topMenu">
      <div>
        <BackButton v-if="hasBackButton" />
      </div>
      <div class="menuButtons">
        <HelpButton />
        <RouterLink :to="{ name: 'settings-page' }">
          <ZKButton icon="mdi-cog" text-color="black" flat v-if="hasSettingsButton" />
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
  gap: 0.5rem;
}

.topMenu {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>