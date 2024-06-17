<template>
  <q-input v-bind="props.inputTextFieldProps" />
</template>

<script setup lang="ts">
import { QInputProps } from "quasar";

interface Props {
  inputTextFieldProps?: QInputProps
}
const props = defineProps<Props>();
</script>
