<template>
  <div>
    <div class="container">
      <div class="optionBar" :style="`background: ${percentageStyle};`">
        <div class="optionTextStyle">
          <div>
            {{ option }}
          </div>
          <div v-if="votedByUser">
            <q-chip icon="mdi-check-circle" color="white">Your Choice</q-chip>
          </div>
        </div>
        <div>
          {{ `${optionPercentage}%` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  option: string;
  optionPercentage: number;
  votedByUser: boolean;
}>();

const percentageStyle =
  props.optionPercentage <= 50
    ? `linear-gradient(90deg, #a5f3fc ${props.optionPercentage}%, #FFFFFF 0)`
    : `linear-gradient(to right, #a5f3fc ${props.optionPercentage}%, #FFFFFF ${100 - props.optionPercentage
    }%)`;
</script>

<style scoped lang="scss">
.container {
  border-style: solid;
  border-width: 1px;
  border-color: #cbd5e1;
}

.optionTextStyle {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.optionBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-weight: bold;
  padding: 1rem;
}
</style>
