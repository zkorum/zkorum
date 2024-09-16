<template>
  <div>
    <div>
      <slot />

      <q-btn unelevated class="floatButton" fab icon="mdi-plus" color="primary" @click="buttonClick()" />

    </div>
  </div>
</template>

<script setup lang="ts">

const emit = defineEmits(["onClick"]);

function buttonClick() {
  emit("onClick");
}

</script>

<style scoped>
.floatButton {
  position: fixed;
  bottom: 4rem;
  right: calc(calc(100vw - calc(min(35rem, 100%))) / 2 + 1rem);
}
</style>