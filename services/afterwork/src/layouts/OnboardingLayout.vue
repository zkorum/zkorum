<template>
  <q-layout view="hHh lpR fFf">
    <q-header v-if="props.hasGoBackButton || props.hasHelpButton" reveal bordered class="bg-white text-brand">
      <q-toolbar>
        <ZKGoBackButton v-if="props.hasGoBackButton" />
        <q-space />
        <ZKButton v-if="props.hasHelpButton" :btnProps="{ icon: 'help' }" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import ZKGoBackButton from "views/ZKGoBackButton.vue";
import ZKButton from "views/ZKButton.vue";
import { OnboardingLayoutProps } from "model/props";
const props = withDefaults(defineProps<OnboardingLayoutProps>(), { hasGoBackButton: true, hasHelpButton: true })
</script>
