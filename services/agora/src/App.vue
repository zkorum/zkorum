<template>
  <!--<router-view />-->

  <router-view v-slot="{ Component }">
    <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <!--
  <TransitionRouterView />
  -->
</template>

<script setup lang="ts">
import { register } from "swiper/element/bundle";

register();

defineOptions({
  name: "App",
});
</script>

<style scoped lang="scss"></style>
