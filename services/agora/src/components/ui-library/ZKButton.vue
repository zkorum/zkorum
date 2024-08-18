<template>
  <q-btn v-bind="props" :color="buttonColor" :text-color="buttonTextColor" no-caps :rounded="true" unelevated />
</template>

<script setup lang="ts">
import { QBtnProps } from "quasar";
import { ref } from "vue";

interface ButtonProps extends Omit<QBtnProps, "color" | "textColor"> {
  colorFlex?: string;
  textColorFlex?: string;
}

const props = defineProps<ButtonProps>();

const buttonColor = ref("");
if (props.colorFlex == undefined) {
  buttonColor.value = "deep-purple";
} else {
  buttonColor.value = props.colorFlex;
}

const buttonTextColor = ref("");
if (props.textColorFlex == undefined) {
  buttonTextColor.value = "deep-purple";
} else {
  buttonTextColor.value = props.textColorFlex;
}

</script>
