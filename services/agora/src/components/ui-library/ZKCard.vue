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
  background-color: #fafafa;
  border-radius: 15px;
  border-style: solid;
  border-width: 1px;
  border-color: #e7e5e4;
  padding: 1rem;
}
</style>