<template>
  <div>
    Welcome

    <ZKButton label="Verify Identity" color="secondary"  @click="verifyIdentity()" />

  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "src/components/ui-library/ZKButton.vue";

const router = useRouter();

function verifyIdentity() {
  router.push({ name: "verification-instructions" });
}

</script>

<style scoped lang="scss"></style>
