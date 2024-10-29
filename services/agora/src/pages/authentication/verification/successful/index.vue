<template>
  <div>
    <div class="container">
      <q-icon name="mdi-check-circle" size="5rem" color="secondary" />

      <div class="title">Account Verified</div>

      <div class="description">
        You can now start participating in the discussions anonymously.
      </div>

      <ZKButton label="Start Exploring"
        color="primary"
        @click="goToHomePage()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goToHomePage() {
  router.push({ name: "default-home-feed" });
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  padding-top: 5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 500;
}

.description {
  text-align: center;
  width: min(100%, 20rem);
}
</style>
