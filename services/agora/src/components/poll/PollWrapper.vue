<template>
  <div @click.stop.prevent="">
    <div v-if="dataLoaded" class="pollContainer">
      <!-- Show buttons for voting -->
      <div v-if="currentDisplayMode == DisplayModes.Vote">
        <div class="pollOptionList">
          <ZKButton v-for="optionItem in localPollOptionList" :key="optionItem.index" outline :label="optionItem.option"
            text-color="primary" @click.stop.prevent="voteCasted(optionItem.index)" />
        </div>
      </div>

      <!-- Show the final result -->
      <div v-if="currentDisplayMode == DisplayModes.Results" class="pollOptionList">
        <option-view v-for="optionItem in localPollOptionList" :key="optionItem.index" :option="optionItem.option"
          :voted-by-user="userVoteStatus.voteIndex == optionItem.index && userVoteStatus.hasVoted" :option-percentage="totalVoteCount === 0
            ? 0
            : Math.round((optionItem.numResponses * 100) / totalVoteCount)
            " />
      </div>

      <div v-if="isAuthenticated && !userVoteStatus.hasVoted" class="actionButtonCluster">
        <ZKButton v-if="currentDisplayMode == DisplayModes.Vote" outline text-color="primary" icon="mdi-chart-bar"
          label="Results" @click.stop.prevent="showResultsInterface()" />

        <ZKButton v-if="currentDisplayMode == DisplayModes.Results" outline text-color="primary" label="Cast Vote"
          icon="mdi-vote" @click.stop.prevent="showVoteInterface()" />

        <div class="voteCount">
          {{ totalVoteCount }} vote<span v-if="totalVoteCount > 1">s</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import OptionView from "components/poll/OptionView.vue";
import ZKButton from "../ui-library/ZKButton.vue";
import { DummyPollOptionFormat, DummyPostUserVote, DummyUserPollResponse } from "src/stores/post";
import { ref, watch } from "vue";
import { useAuthenticationStore } from "src/stores/authentication";
import { storeToRefs } from "pinia";
import { useBackendPollApi } from "src/utils/api/poll";
import { useDialog } from "src/utils/ui/dialog";

const props = defineProps<{
  userResponse: DummyUserPollResponse;
  pollOptions: DummyPollOptionFormat[];
  postSlugId: string;
}>();

const localPollOptionList = ref<DummyPollOptionFormat[]>([]);
initializeLocalPoll();

const dataLoaded = ref(false);

const backendPollApi = useBackendPollApi();
const { showMessage } = useDialog();
const { isAuthenticated } = storeToRefs(useAuthenticationStore());
enum DisplayModes {
  Vote,
  Results
}
const currentDisplayMode = ref<DisplayModes>(isAuthenticated.value ? DisplayModes.Vote : DisplayModes.Results);

const userVoteStatus = ref<DummyPostUserVote>({
  hasVoted: false,
  voteIndex: 0
});

const totalVoteCount = ref(0);
initializeTotalVoteCount();

fetchUserData(false);

function initializeTotalVoteCount() {
  totalVoteCount.value = 0;
  localPollOptionList.value.forEach((option) => {
    totalVoteCount.value += option.numResponses;
  });
}

function incrementLocalPollIndex(targetIndex: number) {
  localPollOptionList.value.forEach(pollOption => {
    if (targetIndex == pollOption.index) {
      pollOption.numResponses += 1;
    }
  });
}

function initializeLocalPoll() {
  props.pollOptions.forEach(pollOption => {
    const localPollItem: DummyPollOptionFormat = {
      index: pollOption.index,
      numResponses: pollOption.numResponses,
      option: pollOption.option
    };
    localPollOptionList.value.push(localPollItem);
  });
}

async function fetchUserData(loadFromRemote: boolean) {
  if (loadFromRemote) {
    const response = await backendPollApi.fetchUserPollResponse(props.postSlugId);
    if (response?.selectedPollOption) {
      userVoteStatus.value = {
        hasVoted: true,
        voteIndex: response.selectedPollOption - 1
      };
      showResultsInterface();
    }
  } else {
    userVoteStatus.value = {
      hasVoted: props.userResponse.hadResponded,
      voteIndex: props.userResponse.responseIndex
    };

    if (userVoteStatus.value.hasVoted) {
      showResultsInterface();
    }
  }


  dataLoaded.value = true;
}

function showResultsInterface() {
  currentDisplayMode.value = DisplayModes.Results;
}

function showVoteInterface() {
  currentDisplayMode.value = DisplayModes.Vote;
}

async function voteCasted(selectedIndex: number) {
  const response = await backendPollApi.submitPollResponse(selectedIndex, props.postSlugId);
  if (response == false) {
    showMessage("Server error", "Failed to cast vote");
  } else {
    fetchUserData(true);
    incrementLocalPollIndex(selectedIndex);
    totalVoteCount.value += 1;
  }
}

watch(currentDisplayMode, () => {
  if (currentDisplayMode.value == DisplayModes.Results) {
    showResultsInterface();
  } else {
    showVoteInterface();
  }
});
</script>

<style scoped lang="scss">
.actionButtonCluster {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  gap: 1rem;
}

.pollOptionList {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pollContainer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: $primary;
}

.voteCount {
  padding-right: 0.5rem;
  padding-left: 0.5rem;
}
</style>
