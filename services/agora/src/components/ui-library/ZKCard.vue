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
  box-shadow: rgba(0, 0, 0, 0.05) 0px 6px 24px 0px,
    rgba(0, 0, 0, 0.08) 0px 0px 0px 1px;
  padding: 1rem;
}
</style>