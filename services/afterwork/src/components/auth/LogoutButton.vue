<script setup lang="ts">
import { useRouter } from "vue-router";
import { Hanko } from "@teamhanko/hanko-elements";

const hankoApi = process.env.HANKO_API_URL;

const router = useRouter();
const hanko = new Hanko(hankoApi);

const logout = () => {
  hanko.user.logout().catch((error) => {
    // handle error
  })
  router.push("/login")
}

</script>

<template>
  <button @click="logout">Logout</button>
</template>
