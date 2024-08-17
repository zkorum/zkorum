<template>
  <q-btn :label="label" :to="to" color="brand" no-caps>
  </q-btn>
</template>

<script setup lang="ts">

interface Props {
  label?: string
  to?: string
}
defineProps<Props>();

</script>
