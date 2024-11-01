<template>
  <div>
    <div class="container">
      <div class="optionBar" :style="`background: ${percentageStyle};`">
        <div class="optionTextStyle">
          <div>
            {{ option }}
          </div>
          <div v-if="optionResponded">
            <q-chip icon="mdi-check-circle">Your Vote</q-chip>
          </div>
        </div>
        <div class="q-ml-auto">
          <span>
            {{ `${optionPercentage}%` }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isVoteMode: boolean;
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
  gap: 1rem;
  font-weight: bold;
  padding: 1rem;
}
</style>
