<template>
  <div>
    <div class="card-decoration">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">


</script>

<style scoped lang="scss">
.card-decoration {
  background-color: #ecfeff;
  border-radius: 15px;
  border-style: solid;
  border-width: 1px;
  border-color: #67e8f9;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}
</style>