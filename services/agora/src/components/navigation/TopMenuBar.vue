<template>
  <q-toolbar class="content-between" style="width: 100%">
    <div style="width: 100%">
      <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat v-if="hasBackButton" @click="router.back()" />
    </div>
    <div class="menuButtons">
      <ZKButton icon="mdi-cog" text-color-flex="black" flat />
      <ZKButton icon="mdi-help" text-color-flex="black" flat />
    </div>
  </q-toolbar>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "../ui-library/ZKButton.vue";

defineProps<{
  hasBackButton: boolean
}>();

const router = useRouter();

</script>

<style scoped>
.menuButtons {
  display: flex;
  gap: 0.5rem;
}
</style>