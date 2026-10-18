<template>
  <div>
    <div
      class="flexLayout"
      :class="{ 'flexLayout--compact': props.density === 'compact' }"
    >
      <q-icon :name="iconName" :size="iconSize" />

      <div
        class="coreText"
        :class="{ 'coreText--compact': props.density === 'compact' }"
      >
        <h1 class="title">
          {{ title }}
        </h1>

        <div v-if="description.length > 0">
          {{ description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    iconName: string;
    density?: "comfortable" | "compact";
  }>(),
  {
    density: "comfortable",
  }
);

const iconSize = computed(() => {
  return props.density === "compact" ? "1.65rem" : "2rem";
});
</script>

<style scoped lang="scss">
.flexLayout {
  display: flex;
  gap: 1rem;
}

.flexLayout--compact {
  gap: 0.75rem;
}

.coreText {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.coreText--compact {
  gap: 0.35rem;
}

.title {
  margin: 0;
  line-height: inherit;
  letter-spacing: normal;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
}
</style>
