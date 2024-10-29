<template>
  <div>
    <div class="container" :style="`background: ${percentageStyle};`">
      <div class="optionTextStyle">
        <div>
          {{ option }}
        </div>
        <div v-if="optionResponded">
          <q-icon name="mdi-check-circle" size="1rem" class="iconPadding" />
        </div>
      </div>
      <div class="q-ml-auto">
        <span>
          {{ `${optionPercentage}%` }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  option: string;
  optionPercentage: number;
  optionResponded: boolean;
}>();

const percentageStyle =
  props.optionPercentage <= 50
    ? `linear-gradient(90deg, #a5f3fc ${props.optionPercentage}%, #FFFFFF 0)`
    : `linear-gradient(to right, #a5f3fc ${props.optionPercentage}%, #FFFFFF ${100 - props.optionPercentage
    }%)`;
</script>

<style scoped>
.optionTextStyle {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.iconPadding {
  padding-bottom: 0.1rem;
}

.container {
  display: flex;
  gap: 1rem;
  font-weight: bold;
  padding: 1rem;
}
</style>
