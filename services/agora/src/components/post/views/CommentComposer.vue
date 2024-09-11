<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <q-editor v-model="commentText" placeholder="Add a comment" min-height="5rem" flat />
        <!--@update:model-value="checkWordCount()"-->
      </div>
    </WidthWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";

const commentText = ref("");

</script>

<style scoped lang="scss">
.container {
  background-color: #a3a3a3;
  padding-top: 0.3rem;
}
</style>