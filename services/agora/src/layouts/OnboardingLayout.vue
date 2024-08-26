<template>
  <div>
    <div class="container">
      <ZKButton icon="mdi-arrow-left" text-color-flex="black" flat @click="router.back()" />

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
import { useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";

// import { OnboardingLayoutProps } from "@/utils/model/props";
// const props = withDefaults(defineProps<OnboardingLayoutProps>(), { hasGoBackButton: true, hasHelpButton: true })

const router = useRouter();

</script>

<style scoped lang="scss">
.container {
  padding: 1rem;
}

.innerContent {
  width: min(100%, 30rem);
  margin: auto;
}
</style>
