<template>
  <div>
    <q-linear-progress :value="progress" :aria-label="label" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  currentStep: number;
  totalSteps: number;
  label: string;
}>();

const progress = computed(() => props.currentStep / props.totalSteps);
</script>
