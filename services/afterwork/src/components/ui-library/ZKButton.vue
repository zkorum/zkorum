<template>
  <q-btn :label="label" :to="to" color="brand" :icon="definedIcon" no-caps :round="round" :flat="flat" />
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  label?: string
  to?: string
  icon?: string
}
const props = defineProps<Props>();

const definedIcon = ref<undefined | string>(undefined);
const round = ref(false);
const flat = ref(false);

if (props.icon != undefined) {
  definedIcon.value = props.icon;
  round.value = true;
  flat.value = true;
}

</script>
