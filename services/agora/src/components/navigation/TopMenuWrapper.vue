<template>
  <div>
    <q-header :reveal="reveal" bordered class="menuStyle">
      <WidthWrapper>
        <slot />
      </WidthWrapper>
    </q-header>
  </div>
</template>

<script setup lang="ts">
import WidthWrapper from "./WidthWrapper.vue";

defineProps<{
  reveal: boolean
}>()

</script>

<style scoped lang="scss">
.menuStyle {
  background-color: $navigation-bar-color;
  height: 3.5rem;
  display: flex;
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>