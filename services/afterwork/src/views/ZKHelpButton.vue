<template>
  <ZKButton :onclick="openHelp" flat outline>
    {{ t("help") }}
  </ZKButton>
</template>

<script setup lang="ts">
import ZKButton from "views/ZKButton.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n()

function openHelp() {
  //TODO
}
</script>
