<template>
  <div @click="closeDialog()">
    <div class="innerContent">
      <div @click="(event: Event) => disablePropagation(event)">
        <slot />
      </div>

      <ZKButton icon="close" flat round dense size="3rem" @click="closeDialog()" />
    </div>
  </div>

</template>

<script setup lang="ts">
import ZKButton from "../ui-library/ZKButton.vue";

const openPostDialog = defineModel<boolean>()

function closeDialog() {
  openPostDialog.value = false;
}

function disablePropagation(event: Event) {
  event.stopPropagation();
}

</script>

<style scoped>
.innerContent {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  justify-content: center;
  width: min(100%, 40rem);
  margin: auto;
  padding-top: 2rem;
  padding-bottom: 10rem;
}
</style>
