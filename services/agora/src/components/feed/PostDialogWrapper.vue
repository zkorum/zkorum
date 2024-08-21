<template>
  <div>
    <div class="container">
      <div class="innerContent">
        <slot />
        <ZKButton icon="close" flat round dense v-close-popup size="3rem" />
      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";
</script>

<style scoped>
.container {
  width: 100%;
}

.innerContent {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  justify-content: center;
  width: min(100%, 40rem);
  margin: auto;
  padding-top: 2rem;
  padding-bottom: 10rem;
}
</style>
