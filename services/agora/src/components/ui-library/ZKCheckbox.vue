<template>
  <div class="zk-checkbox">
    <q-checkbox
      v-model="checked"
      color="primary"
      :disable="disabled"
      v-bind="requiredAttributes"
      :aria-describedby="hasDescription() ? descriptionId : undefined"
    >
      <ZKFieldLabel
        :label="label"
        :required="required"
        :required-text="undefined"
      />
    </q-checkbox>
    <small v-if="hasDescription()" :id="descriptionId">
      <slot name="description">{{ description }}</slot>
    </small>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, type VNode } from "vue";

import ZKFieldLabel from "./ZKFieldLabel.vue";

const props = defineProps<{
  label: string;
  description: string | undefined;
  required: boolean;
  disabled: boolean;
}>();

const slots = defineSlots<{
  description?: () => VNode[];
}>();

const checked = defineModel<boolean>({ required: true });
const descriptionId = `zk-checkbox-description-${useId()}`;

function hasDescription(): boolean {
  return props.description !== undefined || slots.description !== undefined;
}

const requiredAttributes = computed(() =>
  props.required ? { "aria-required": "true" } : {}
);
</script>

<style scoped lang="scss">
.zk-checkbox {
  display: grid;
  gap: 0.2rem;

  small {
    padding-inline-start: 2.5rem;
    color: $grey-7;
    line-height: 1.4;
  }

  :deep(.q-checkbox__label) {
    line-height: 1.4;
  }
}
</style>
