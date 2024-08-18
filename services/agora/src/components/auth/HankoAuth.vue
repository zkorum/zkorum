<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import { register } from "@teamhanko/hanko-elements";

const hankoApi = process.env.HANKO_API_URL;

const router = useRouter();

const redirectAfterLogin = () => {
  // successfully logged in, redirect to a page in your application
  router.push("/");
};

onMounted(() => {
  register(hankoApi)
    .catch((error) => {
      console.error(error)
      // handle error
    });
});
</script>

<template>
  <hanko-auth @onAuthFlowCompleted="redirectAfterLogin" />
</template>
