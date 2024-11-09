<template>
  <q-inner-loading :showing="showLoading" label="Submitting post..." label-class="text-teal"
    label-style="font-size: 1.2em">
  </q-inner-loading>
</template>

<script setup lang="ts">

defineProps<{
  showLoading: boolean
}>();

</script>
