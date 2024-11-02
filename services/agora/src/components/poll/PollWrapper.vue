<template>
  <div @click.stop.prevent="">
    <div v-if="dataLoaded" class="pollContainer">

      <div v-if="pollButtonGroupOptionModel == DisplayModes.Vote">
        <div class="pollOptionList">
          <ZKButton v-for="optionItem in localPollOptions" :key="optionItem.index" outline :label="optionItem.option"
            text-color="primary" @click.stop.prevent="voteCasted(optionItem.index)" />
        </div>

      </div>

      <div v-if="pollButtonGroupOptionModel == DisplayModes.Results" class="pollOptionList">
        <option-view v-for="optionItem in localPollOptions" :key="optionItem.index" :option="optionItem.option"
          :is-vote-mode="isVoteMode" :option-responded="localUserVote.voteIndex == optionItem.index &&
            localUserVote.hasVoted
            " :option-percentage="totalCount === 0
              ? 0
              : Math.round((optionItem.numResponses * 100) / totalCount)
              " />
      </div>

      <div class="voteCounter">
        {{ totalCount }} vote<span v-if="totalCount > 1">s</span>
      </div>

      <q-btn-toggle v-if="!localUserVote.hasVoted && isAuthenticated" v-model="pollButtonGroupOptionModel" unelevated
        spread no-caps toggle-color="purple" color="white" text-color="black" :options="pollButtonGroupOptions" />

    </div>
  </div>
</template>

<script setup lang="ts">
import OptionView from "components/poll/OptionView.vue";
import ZKButton from "../ui-library/ZKButton.vue";
import { DummyPollOptionFormat, DummyPostUserVote } from "src/stores/post";
import { computed, ref, toRaw, watch } from "vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";
import { useBackendPollApi } from "src/utils/api/poll";
import { useDialog } from "src/utils/ui/dialog";

const props = defineProps<{
  pollOptions: DummyPollOptionFormat[];
  userVote: DummyPostUserVote;
  postSlugId: string;
}>();

const dataLoaded = ref(false);

const backendPollApi = useBackendPollApi();
const { showMessage } = useDialog();
const { isAuthenticated } = storeToRefs(useAuthenticationStore());
enum DisplayModes {
  Vote,
  Results
}
const pollButtonGroupOptionModel = ref<DisplayModes>(isAuthenticated.value ? DisplayModes.Vote : DisplayModes.Results);

const pollButtonGroupOptions = [
  { label: "Vote", value: DisplayModes.Vote },
  { label: "Results", value: DisplayModes.Results }

];

const localPollOptions = structuredClone(toRaw(props.pollOptions));
const localUserVote = structuredClone(toRaw(props.userVote));

let totalCount = 0;
props.pollOptions.forEach((option) => {
  totalCount += option.numResponses;
});

prepareData();

function prepareData() {
  dataLoaded.value = true;
}

function showResultsInterface() {
  pollButtonGroupOptionModel.value = DisplayModes.Results;
}

function showVoteInterface() {
  pollButtonGroupOptionModel.value = DisplayModes.Vote;
}

async function voteCasted(selectedIndex: number) {
  const response = await backendPollApi.submitPollResponse(selectedIndex, props.postSlugId);
  if (response == false) {
    showMessage("Server error", "Failed to cast vote (each poll can only have 1 vote, create a new poll if you need to test)");
  } else {
    showMessage("Casted Vote", "Refresh page to see result");
  }
}

const isVoteMode = computed(() => {
  return pollButtonGroupOptionModel.value == DisplayModes.Vote;
});

watch(pollButtonGroupOptionModel, () => {
  if (pollButtonGroupOptionModel.value == DisplayModes.Results) {
    showResultsInterface();
  } else {
    showVoteInterface();
  }
});
</script>

<style scoped>
.pollOptionList {
  display: flex;
  flex-direction: column;
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
  cursor: auto;
}

.voteCounter {
  color: #737373;
}
</style>
