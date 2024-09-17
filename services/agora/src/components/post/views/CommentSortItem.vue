<template>
  <div>
    <div class="container" :class="{ highlight: isSelected }">
      <q-icon :name="sortItem.icon" size="2rem" color="color-text-weak" />
      <div class="label">
        {{ sortItem.label }}
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { CommentSortingItemInterface } from "src/utils/component/comments";

defineProps<{
  sortItem: CommentSortingItemInterface;
  isSelected: boolean;
}>();

</script>

<style scoped lang="scss">
.label {
  font-size: 0.8rem;
}

.container {
  display:flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  margin: 0.2rem;
}

.container:hover {
  border-radius: 15px;
  background-color: rgb(0 0 0 / 0.08);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.highlight {
  border-radius: 15px;
  border-style: solid;
  border-width: 1px;
  border-color: $color-text-weak;
}

</style>
