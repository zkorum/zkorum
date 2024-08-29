<template>
  <ZKButton :onclick="goBack" icon="arrow_back" />
</template>

<script setup lang="ts">
import ZKButton from "./ZKButton.vue";
import { useRouter } from "vue-router";

const router = useRouter()

function goBack() {
  router.back();
}
</script>
