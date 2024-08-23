<template>
  <div>

    <div class="headerTitle">
      What other people think about the statement
    </div>

    <div class="pollOptionList">
      <option-view :option="options.option1"
        :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 1"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((result.option1Response * 100) / totalCount)" />
      <option-view :option="options.option2"
        :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 2"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((result.option2Response * 100) / totalCount)" />
      <option-view v-if="options.option3 !== undefined && result.option3Response !== undefined"
        :option="options.option3" :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 3"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((result.option3Response * 100) / totalCount)" />
      <option-view v-if="options.option4 !== undefined && result.option4Response !== undefined"
        :option="options.option4" :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 4"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((result.option4Response * 100) / totalCount)" />
      <option-view v-if="options.option5 !== undefined && result.option5Response !== undefined"
        :option="options.option5" :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 5"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((result.option5Response * 100) / totalCount)" />
      <option-view v-if="options.option6 !== undefined && result.option6Response !== undefined"
        :option="options.option6" :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 6"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((result.option6Response * 100) / totalCount)" />
    </div>
    <div class="text-body2">
      {{ totalCount <= 1 ? `${totalCount} vote` : `${totalCount} votes` }} </div>
    </div>
</template>

<script setup lang="ts">
import OptionView from "components/poll/OptionView.vue";
import type {
  PollResult,
  PollOptions,
  PollOptionAndPseudonym,
} from "@/shared/types/zod";
import { zeroIfUndefined } from "src/utils/common";
const props = defineProps<{
  result: PollResult,
  options: PollOptions,
  pollResponse: PollOptionAndPseudonym | undefined,
}>()

const totalCount =
  props.result.option1Response +
  props.result.option2Response +
  zeroIfUndefined(props.result.option3Response) +
  zeroIfUndefined(props.result.option4Response) +
  zeroIfUndefined(props.result.option5Response) +
  zeroIfUndefined(props.result.option6Response);
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
