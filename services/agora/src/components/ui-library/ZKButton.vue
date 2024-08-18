<template>
  <q-btn :label="label" :type="type" :to="to" :color="color" :text-color="textColor" :icon="definedIcon" no-caps
    :rounded="true" unelevated />
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  label: String,
  to: [String, Object],
  icon: String,
  color: {
    type: String,
    default: "deep-purple"
  },
  textColor: String,
  type: String
});

const definedIcon = ref<undefined | string>(undefined);
const flat = ref(false);

if (props.icon != undefined) {
  definedIcon.value = props.icon;
  flat.value = true;
}

</script>
