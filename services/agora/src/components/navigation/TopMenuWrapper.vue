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
.menuStyle {
  background-color: #fafafa;
  padding: 0.5rem;
}
</style>