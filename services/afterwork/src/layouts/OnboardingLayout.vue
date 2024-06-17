<template>
  <q-layout view="hHh lpR fFf">
    <q-header v-if="props.hasGoBackButton || props.hasHelpButton" reveal bordered class="bg-white text-brand"
      height-hint="98">
      <q-toolbar>
        <ZKGoBackButton v-if="props.hasGoBackButton" />
        <q-space />
        <ZKHelpButton v-if="props.hasHelpButton" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <!-- <transition appear enter-active-class="animated slideInRight" leave-active-class="animated slideOutRight" -->
      <!-- mode="out-in"> -->
      <transition-router-view />
      <!-- </transition> -->
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import ZKGoBackButton from "views/ZKGoBackButton.vue";
import ZKHelpButton from "views/ZKHelpButton.vue";
import { OnboardingLayoutProps } from "model/props";
import TransitionRouterView from "router/TransitionRouterView.vue"
const props = withDefaults(defineProps<OnboardingLayoutProps>(), { hasGoBackButton: true, hasHelpButton: true })
</script>
