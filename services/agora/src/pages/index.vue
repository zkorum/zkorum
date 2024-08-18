<template>
  <div>
    <CompactPostList />
  </div>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn fab icon="add" color="accent" unelevated />
  </q-page-sticky>

</template>

<script setup lang="ts">
import CompactPostList from "@/components/feed/CompactPostList.vue";

</script>
