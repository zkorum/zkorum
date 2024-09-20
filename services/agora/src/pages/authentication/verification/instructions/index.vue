<template>
  <div>
    Instructions

    <ZKButton label="Skip for later" color="secondary" @click="skipButton()" />


  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "src/components/ui-library/ZKButton.vue";

const router = useRouter();

function skipButton() {
  router.push({ name: "default-home-feed" });
}

</script>

<style scoped lang="scss">
</style>
