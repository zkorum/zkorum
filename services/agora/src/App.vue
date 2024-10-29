<template>
  <!--<router-view />-->

  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<script setup lang="ts">
import * as swiperElement from "swiper/element/bundle";
import { onMounted } from "vue";
import { useBackendAuthApi } from "./utils/api/auth";

swiperElement.register();

const authenticationStore = useBackendAuthApi();

onMounted(() => {
  authenticationStore.initializeAuthState();
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
