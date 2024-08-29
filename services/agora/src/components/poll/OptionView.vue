<template>
  <div class="row items-center justify-start q-px-md q-py-sm q-my-xs text-bold"
    :style="`background: ${percentageStyle};`">
    <div>
      {{ optionResponded ? `${option} ✔️` : option }}
    </div>
    <div class="q-ml-auto">
      {{ `${optionPercentage}%` }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  option: string
  optionPercentage: number;
  optionResponded: boolean
}>()
const percentageStyle = props.optionPercentage <= 50
  ? `linear-gradient(90deg, #22d3ee ${props.optionPercentage}%, #FFFFFF 0)`
  : `linear-gradient(to right, #22d3ee ${props.optionPercentage}%, #FFFFFF ${100 - props.optionPercentage
  }%)`
// import { computed, ref } from "vue";
// import { Todo, Meta } from "./models";
//
// interface Props {
//     title: string;
//     todos?: Todo[];
//     meta: Meta;
//     active: boolean;
// }
//
// const props = withDefaults(defineProps<Props>(), {
//     todos: () => [],
// });
//
// const clickCount = ref(0);
// function increment() {
//     clickCount.value += 1;
//     return clickCount.value;
// }
//
// const todoCount = computed(() => props.todos.length);
</script>

<style scoped></style>
