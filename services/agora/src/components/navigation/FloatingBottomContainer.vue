<template>
  <div>
    <div class="bottomBar">
      <slot />
    </div>
  </div>

</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.bottomBar {
  position: fixed;
  bottom: 0rem;
  width: 100%;
  right: 0rem;
  z-index: 100;
}
</style>
