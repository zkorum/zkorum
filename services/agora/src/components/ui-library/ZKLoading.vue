<template>
  <div v-if="showSpinner">
    <div class="loaderPositioning">
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProgressSpinner from "primevue/progressspinner";
import { ref, watch } from "vue";

const props = defineProps<{
  dataReady: boolean;
}>();

const showSpinner = ref(false);

setTimeout(
  function () {
    checkDataReadyStatus();
  }, 500);

watch(() => props.dataReady, () => {
  checkDataReadyStatus();
});

function checkDataReadyStatus() {
  if (props.dataReady) {
    showSpinner.value = false;
  } else {
    showSpinner.value = true;
  }
}

</script>

<style lang="scss">
.loaderPositioning {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 5rem;
  padding-bottom: 5rem;
}
</style>
