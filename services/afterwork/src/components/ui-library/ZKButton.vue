<template>
  <q-btn :label="label" :to="to" :color="color" :text-color="textColor" :icon="definedIcon" no-caps :rounded="rounded"
    unelevated />
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  label?: string;
  to?: string;
  icon?: string;
  rounded?: boolean;
  color?: string;
  textColor?: string;
}
const props = defineProps<Props>();

const definedIcon = ref<undefined | string>(undefined);
const flat = ref(false);

if (props.icon != undefined) {
  definedIcon.value = props.icon;
  flat.value = true;
}

</script>
