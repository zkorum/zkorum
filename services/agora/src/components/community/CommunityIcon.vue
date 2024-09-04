<template>
  <img class="flagImage" :src="imageLink" />
</template>

<script setup lang="ts">
import { ref } from "vue";

const imageLink = ref("/images/communities/flags/WORLD.svg");

</script>

<style scoped>
.flagImage {
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: #e5e7eb;
  max-width: 100%;
}
</style>