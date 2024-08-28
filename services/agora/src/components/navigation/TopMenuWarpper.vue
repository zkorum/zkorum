<template>
  <div>
    <q-header :reveal="true" bordered class="menuStyle">
      <slot />
    </q-header>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.menuButtons {
  display: flex;
  gap: 0.5rem;
}

.menuStyle {
  display: flex;
  justify-content: space-around;
  background-color: #fafafa;
  padding: 0.5rem;
}
</style>