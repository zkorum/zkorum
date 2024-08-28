<template>
  <TopMenuWarpper>
    <div style="width: 100%">
      <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat v-if="hasBackButton" @click="router.back()" />
    </div>
    <div class="menuButtons">
      <ZKButton icon="mdi-cog" text-color-flex="black" flat v-if="showSettingsMenu" />
      <ZKButton icon="mdi-help" text-color-flex="black" flat />
    </div>
  </TopMenuWarpper>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "../ui-library/ZKButton.vue";
import TopMenuWarpper from "@/components/navigation/TopMenuWarpper.vue";

defineProps<{
  hasBackButton: boolean
  showSettingsMenu: boolean
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