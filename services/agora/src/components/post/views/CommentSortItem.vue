<template>
  <div>
    <div class="container">
      <q-icon :name="sortItem.icon2" class="icon" />
      <div class="label">
        {{ sortItem.label2 }}
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { CommentSortingItemInterface } from "src/utils/component/comments";

defineProps<{
  sortItem: CommentSortingItemInterface;
}>();

</script>

<style scoped lang="scss">
.label {
  font-size: 0.8rem;
}

.container {
  padding: 0.2rem;
}

.icon {
  padding-bottom: 0.2rem;
}

</style>
