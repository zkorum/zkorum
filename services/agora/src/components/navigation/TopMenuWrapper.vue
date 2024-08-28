<template>
  <div>
    <q-header :reveal="true" bordered class="menuStyle">
      <div class="innerStyle">
        <slot />
      </div>
    </q-header>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.menuStyle {
  background-color: #fafafa;
}

.innerStyle {
  padding: 0.5rem;
  width: min(40rem, 100%);
  margin: auto;
}
</style>