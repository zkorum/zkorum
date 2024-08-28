<template>
  <TopMenuWarpper>
    <div style="width: 100%">
      <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat v-if="hasBackButton" @click="router.back()" />
    </div>
    <div class="menuButtons">
      <ZKButton icon="mdi-cog" text-color-flex="black" flat v-if="hasSettingsButton" />
      <HelpButton />
    </div>
  </TopMenuWarpper>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "../ui-library/ZKButton.vue";
import TopMenuWarpper from "@/components/navigation/TopMenuWarpper.vue";
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
</style>