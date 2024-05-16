<template>
  <router-view v-slot="{ Component, route }">
    <!-- <transition v-if="route.meta.transition !== undefined" appear -->
    <!--   :enter-active-class="route.meta.transition === 'slide-enter' ? 'animated slideInRight' : route.meta.transition === 'slide-leave' ? 'animated slideInLeft' : ''" -->
    <!--   :leave-active-class="'animated fadeOut fast'" mode="out-in"> -->
    <!--   <component :is="Component" :key="route.path" /> -->
    <!-- </transition> -->
    <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut " mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
defineOptions({
  name: "TransitionRouterView",
});
</script>
