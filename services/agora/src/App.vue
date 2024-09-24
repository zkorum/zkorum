<template>
  <!--<router-view />-->

  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>

</template>

<script setup lang="ts">
import { register } from "swiper/element/bundle";

register();

defineOptions({
  name: "App",
});
</script>

<style lang="scss">
body {
  font-size: 1rem;
  background-color: white;
  color: rgb(24, 28, 31);
}

a {
  color: rgb(24, 28, 31);
  text-decoration: none;
}

</style>
