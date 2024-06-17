<template>
  <div class="window-width window-height column flex-center" style="gap: 20px; background-color: #4BE7DE;">
    <q-img src="afterwork.png" style="width: 336px; height: 390px;" />
    <div>
      <ZKButton to="/onboarding/login">{{ t("welcome.login") }}</ZKButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import ZKButton from "views/ZKButton.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n()

</script>
