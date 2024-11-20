<template>
  <q-input v-bind="props" />
</template>

<script setup lang="ts">
import { type QInputProps } from "quasar";

const props = defineProps<QInputProps>();
</script>
