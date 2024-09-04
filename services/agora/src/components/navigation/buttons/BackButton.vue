<template>
  <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat @click="buttonClicked()" />
</template>

<script setup lang="ts">
import ZKButton from "@/components/ui-library/ZKButton.vue";
import { useGoBackButtonHandler } from "@/utils/nav/goBackButton";

const goBackButtonHandler = useGoBackButtonHandler();

function buttonClicked() {
  goBackButtonHandler.goBack();
}

</script>

<style scoped></style>