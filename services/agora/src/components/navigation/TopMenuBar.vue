<template>
  <TopMenuWrapper>
    <div class="topMenu">
      <div>
        <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat v-if="hasBackButton" @click="router.back()" />
      </div>
      <div class="menuButtons">
        <HelpButton />
        <RouterLink :to="{ name: 'settings-page' }">
          <ZKButton icon="mdi-cog" text-color-flex="black" flat v-if="hasSettingsButton" />
        </RouterLink>
      </div>
    </div>
  </TopMenuWrapper>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "../ui-library/ZKButton.vue";
import TopMenuWrapper from "./TopMenuWrapper.vue";
import HelpButton from "./buttons/HelpButton.vue";

defineProps<{
  hasBackButton: boolean
  hasSettingsButton: boolean
}>();

const router = useRouter();

</script>

<style scoped>
.menuButtons {
  display: flex;
  gap: 0.5rem;
}

.menuStyle {
  background-color: #fafafa;
}

.topMenu {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>