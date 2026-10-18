<template>
  <div>
    <q-linear-progress :value="progress" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  currentStep: number;
  totalSteps: number;
}>();

const progress = computed(() => props.currentStep / props.totalSteps);
</script>
