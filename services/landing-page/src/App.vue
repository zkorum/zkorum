<template>
  <router-view />
</template>

<script setup lang="ts">
if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
</script>
