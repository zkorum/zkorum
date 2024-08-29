<template>
  <div>
    <q-header :reveal="true" bordered class="menuStyle">
      <WidthWrapper>
        <slot />
      </WidthWrapper>
    </q-header>
  </div>
</template>

<script setup lang="ts">
import WidthWrapper from "./WidthWrapper.vue";
</script>

<style scoped>
.menuStyle {
  background-color: #fafafa;
  padding: 0.6rem;
}
</style>