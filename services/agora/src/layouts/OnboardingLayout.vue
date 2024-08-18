<template>
  <div>
    <div class="container">
      <!--
      <q-header v-if="props.hasGoBackButton || props.hasHelpButton" reveal bordered class="bg-white text-brand">

        <q-toolbar>
          <ZKGoBackButton v-if="props.hasGoBackButton" />
          <q-space />
          <ZKButton v-if="props.hasHelpButton" icon="help" />
        </q-toolbar>
      </q-header>
      
      <q-page-container>
        <router-view />
      </q-page-container>
    -->
      <router-view />

    </div>
  </div>

</template>

<script setup lang="ts">
// import { OnboardingLayoutProps } from "@/utils/model/props";
// const props = withDefaults(defineProps<OnboardingLayoutProps>(), { hasGoBackButton: true, hasHelpButton: true })
</script>

<style scoped>
.container {
  max-width: min(30rem, 100%);
  margin: auto;
  padding: 1rem;
}
</style>
