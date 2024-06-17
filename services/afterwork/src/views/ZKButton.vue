<template>
  <q-btn v-bind="props.btnProps" color="brand" no-caps>
    <slot></slot>
  </q-btn>
</template>

<script setup lang="ts">
import { QBtnProps } from "quasar";

interface Props {
  btnProps?: QBtnProps
}
const props = defineProps<Props>();
</script>
