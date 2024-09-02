<template>
  <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat @click="goBack()" />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";

const router = useRouter();

function goBack() {
  router.back();
}

</script>

<style scoped></style>