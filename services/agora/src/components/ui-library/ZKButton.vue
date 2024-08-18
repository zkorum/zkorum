<template>
  <q-btn v-bind="props" color="deep-purple" text-color="white" no-caps :rounded="true" unelevated />
</template>

<script setup lang="ts">
import { QBtnProps } from "quasar";

const props = defineProps<QBtnProps>();
</script>
