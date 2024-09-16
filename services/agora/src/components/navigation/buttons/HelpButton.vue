<template>
  <RouterLink :to="{ name: 'help-page' }">
    <ZKButton icon="mdi-help" text-color="black" flat />
  </RouterLink>
</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
</script>

<style scoped></style>
