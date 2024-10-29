<template>
  <q-header :reveal="reveal" bordered class="menuStyle">
    <div class="topMenu">
      <slot />
    </div>
  </q-header>
</template>

<script setup lang="ts">
defineProps<{
  reveal: boolean;
}>();
</script>

<style scoped lang="scss">
.menuStyle {
  background-color: $navigation-bar-color;
  height: 3.5rem;
}

.topMenu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>
