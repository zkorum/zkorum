<template>
  <div>
    {{ title }}

    <q-input outlined no-error-icon type="text" v-model="textData" lazy-rules :rules="[val => val && val.length > 0]" />
  </div>
</template>

<script setup lang="ts">

const textData = defineModel<string>()

defineProps<{
  title: string
}>()

</script>
