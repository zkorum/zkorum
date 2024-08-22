  <template>
    <ZKButton label="Go Back" color-flex="info" @click="backButtonClicked()" />
  </template>

<script setup lang="ts">
import ZKButton from "@/components/ui-library/ZKButton.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function backButtonClicked() {
  router.back();
}

</script>

<style scoped></style>

<style scoped></style>
