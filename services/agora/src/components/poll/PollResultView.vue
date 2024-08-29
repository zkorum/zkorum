<template>
  <div>

    <div class="headerTitle">
      What other people think about the statement
    </div>

    <div class="pollOptionList">
      <option-view v-for="option in pollOptions" v-bind:key="option.name" :option="option.name"
        :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 1"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((option.numResponses * 100) / totalCount)" />
    </div>
    <div class="text-body2">
      {{ totalCount <= 1 ? `${totalCount} vote` : `${totalCount} votes` }} </div>
    </div>
</template>

<script setup lang="ts">
import OptionView from "components/poll/OptionView.vue";
import type {
  PollOptionAndPseudonym,
} from "@/shared/types/zod";
import { DummyPollOptionFormat } from "@/stores/post";
const props = defineProps<{
  pollOptions: DummyPollOptionFormat[],
  pollResponse: PollOptionAndPseudonym | undefined,
}>()

let totalCount = 0;
props.pollOptions.forEach(option => {
  totalCount += option.numResponses;
});
</script>

<style scoped>
.pollOptionList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.headerTitle {
  font-size: 1rem;
  padding-bottom: 0.5rem;
}
</style>
