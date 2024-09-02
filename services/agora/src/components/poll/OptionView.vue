<template>
  <div class="row items-center justify-start q-px-md q-py-sm q-my-xs text-bold"
    :style="`background: ${percentageStyle};`">
    <div>
      {{ optionResponded ? `${option} ✔️` : option }}
    </div>
    <div class="q-ml-auto">
      <span>
        {{ `${optionPercentage}%` }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  option: string
  optionPercentage: number;
  optionResponded: boolean;
}>();

const percentageStyle = props.optionPercentage <= 50
  ? `linear-gradient(90deg, #22d3ee ${props.optionPercentage}%, #FFFFFF 0)`
  : `linear-gradient(to right, #22d3ee ${props.optionPercentage}%, #FFFFFF ${100 - props.optionPercentage
  }%)`;

</script>

<style scoped></style>
