<template>
  <div>
    <div class="container">
      <q-editor v-model="commentText" placeholder="Add a comment" min-height="2rem" flat />
      <!--@update:model-value="checkWordCount()"-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const commentText = ref("");

</script>

<style scoped lang="scss">
.container {
  background-color: #e2e8f0;
  padding: 0.5rem;
}
</style>