<template>
  <div>
    <div class="container">
      <TopMenuBar :has-back-button="true" :show-settings-menu="false" />

      <!--
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
      <div class="innerContent">
        <router-view class="" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import TopMenuBar from "@/components/navigation/TopMenuBar.vue";

// import { OnboardingLayoutProps } from "@/utils/model/props";
// const props = withDefaults(defineProps<OnboardingLayoutProps>(), { hasGoBackButton: true, hasHelpButton: true })

</script>

<style scoped lang="scss">
.container {
  padding-left: 1rem;
  padding-right: 1rem;
}

.innerContent {
  width: min(100%, 30rem);
  margin: auto;
}
</style>
