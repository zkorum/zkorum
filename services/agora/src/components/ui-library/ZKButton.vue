<template>
  <q-btn v-bind="props" :color="buttonColor" :text-color="buttonTextColor" no-caps :rounded="true" unelevated>
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
import { QBtnProps } from "quasar";
import { ref, watch } from "vue";

interface ButtonProps extends Omit<QBtnProps, "color" | "textColor"> {
  colorFlex?: string;
  textColorFlex?: string;
}

const props = defineProps<ButtonProps>();
const buttonColor = ref("");
const buttonTextColor = ref("");

changeButtonColor();
changeButtonTextColor();

function changeButtonColor() {
  if (props.colorFlex == undefined) {
    buttonColor.value = "accent";
  } else {
    buttonColor.value = props.colorFlex;
  }
}

function changeButtonTextColor() {
  if (props.textColorFlex == undefined) {
    buttonTextColor.value = "white";
  } else {
    buttonTextColor.value = props.textColorFlex;
  }
}

watch(() => props.colorFlex, () => {
  changeButtonColor();
})

watch(() => props.textColorFlex, () => {
  changeButtonTextColor();
})

</script>
