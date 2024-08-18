<template>
  <ZKButton :onclick="goBack" flat outline icon="arrow_back">
  </ZKButton>
</template>

<script setup lang="ts">
import ZKButton from "./ZKButton.vue";
import { useRouter } from "vue-router";

const router = useRouter()

function goBack() {
  router.back();
}
</script>
