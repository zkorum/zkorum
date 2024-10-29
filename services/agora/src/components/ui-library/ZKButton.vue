<template>
  <q-btn v-bind="props" no-caps :rounded="true" unelevated>
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
import { QBtnProps } from "quasar";

const props = defineProps<QBtnProps>();
</script>
