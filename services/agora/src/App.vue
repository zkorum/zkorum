<template>
  <!--<router-view />-->

  <router-view v-slot="{ Component }">
    <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut" mode="out-in">
      <component :is="Component" class="container text-brand" />
    </transition>
  </router-view>

  <!--
  <TransitionRouterView />
  -->
</template>

<script setup lang="ts">

defineOptions({
  name: "App",
});
</script>

<style scoped>
.container {
  padding-bottom: 10rem;
}
</style>
