<template>
  <div>
    <div>
      <div v-if="showResults" class="pollContainer">

        <div class="headerTitle">
          What other people think about the statement
        </div>

        <div class="pollOptionList">
          <option-view v-for="option in pollOptions" v-bind:key="option.index" :option="option.name"
            :optionResponded="false"
            :optionPercentage="totalCount === 0 ? 0 : Math.round((option.numResponses * 100) / totalCount)" />
        </div>

        <div>
          {{ totalCount <= 1 ? `${totalCount} vote` : `${totalCount} votes` }} </div>
        </div>
      </div>

      <div v-if="!showResults" class="pollContainer">

        <div class="headerTitle">
          Vote on other people's statements
        </div>

        <div class="pollOptionList">
          <q-radio v-for="option in pollOptions" v-bind:key="option.index" v-model="selectedOptionIndex"
            :val="option.index" :label="option.name" />
        </div>

        <div class="actionButtonCluster" v-if="!showResults">
          <div>
            <ZKButton outline text-color-flex="black" label="Vote" @click="showResults = true"
              :disable="selectedOptionIndex == -1" />
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

const selectedOptionIndex = ref<number>(-1);

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
</style>
