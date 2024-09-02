<template>
  <div>
    <div>
      <div v-if="showResults" class="pollContainer">

        <div class="pollOptionList">
          <option-view v-for="option in pollOptions" v-bind:key="option.index" :option="option.name"
            :optionResponded="votedOptionIndex == option.index"
            :optionPercentage="totalCount === 0 ? 0 : Math.round((option.numResponses * 100) / totalCount)" />
        </div>

        <div class="voteCounter">
          {{ totalCount <= 1 ? `${totalCount} vote` : `${totalCount} votes` }} </div>
        </div>

        <div v-if="!showResults" class="pollContainer">

          <div class="pollOptionList">
            <q-radio v-for="option in pollOptions" v-bind:key="option.index" v-model="votedOptionIndex"
              :val="option.index" :label="option.name" />
          </div>

          <div class="actionButtonCluster" v-if="!showResults">
            <div>
              <ZKButton outline text-color-flex="black" label="Vote" @click="showResults = true"
                :disable="votedOptionIndex == -1" />
            </div>
            <div>
              <ZKButton outline text-color-flex="black" label="Show Results" @click="showResults = true" />
            </div>
          </div>

        </div>

        <!--
      <option-view v-for="option in pollOptions" v-bind:key="option.name" :option="option.name"
        :optionResponded="pollResponse !== undefined && pollResponse.optionChosen === 1"
        :optionPercentage="totalCount === 0 ? 0 : Math.round((option.numResponses * 100) / totalCount)" />
      -->
      </div>
    </div>

</template>

<script setup lang="ts">
import OptionView from "components/poll/OptionView.vue";
import ZKButton from "../ui-library/ZKButton.vue";
import type {
} from "@/shared/types/zod";
import { DummyPollOptionFormat, DummyPostUserVote } from "@/stores/post";
import { ref } from "vue";

const props = defineProps<{
  pollOptions: DummyPollOptionFormat[];
  userVote: DummyPostUserVote;
}>()

const showResults = ref(props.userVote.hasVoted);

const votedOptionIndex = ref<number>(-1);
if (props.userVote.hasVoted) {
  votedOptionIndex.value = props.userVote.voteIndex;
}

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

.actionButtonCluster {
  display: flex;
  gap: 1rem;
}

.pollContainer {
  background-color: white;
  padding: 1rem;
  border-radius: 15px;
  border-style: solid;
  border-color: #d1d5db;
  border-width: 1px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.voteCounter {
  color: #737373;
}
</style>
