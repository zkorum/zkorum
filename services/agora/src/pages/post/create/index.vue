<template>
  <div>
    <q-form @submit="onSubmit" @reset="onReset">
      <div class="formStyle">

        <div>
          <ZKButton @click="openCommunitySheet()">
            <div class="communityButton">
              <CommunityIcon :community-id="selectedCommunityId" :show-country-name="false" :compact="true" />
              <div>
                a/{{ selectedCommunityId }}
              </div>
            </div>
          </ZKButton>
        </div>

        <div class="formElement">
          <div class="header">
            Title *
          </div>
          <q-input outlined no-error-icon type="text" v-model="postTitle" lazy-rules
            :rules="[val => val && val.length > 0]" />
        </div>

        <div class="formElement">
          <div class="header">
            Description (optional)
          </div>
          <q-input outlined no-error-icon type="textarea" v-model="postBody" lazy-rules />
        </div>

        <!--<q-toggle v-model="accept" label="I accept the license and terms" />-->

        <div class="formElement">
          <div class="header">
            Enable Polling <q-toggle v-model="enablePolling" />
          </div>

          <div v-if="enablePolling">
            <PollingFormInputOption title="Option 1 *" v-model="pollingOption1" />
            <PollingFormInputOption title="Option 2 *" v-model="pollingOption2" />
            <PollingFormInputOption title="Option 3 *" v-model="pollingOption3" v-if="numPollOptions > 2" />
            <PollingFormInputOption title="Option 4 *" v-model="pollingOption4" v-if="numPollOptions > 3" />
            <PollingFormInputOption title="Option 5 *" v-model="pollingOption5" v-if="numPollOptions > 4" />
            <PollingFormInputOption title="Option 6 *" v-model="pollingOption6" v-if="numPollOptions > 5" />

            <div class="buttonCluster">
              <ZKButton label="Option" icon="mdi-plus" @click="numPollOptions++" :disable="numPollOptions == 6" />
              <ZKButton label="Option" icon="mdi-minus" @click="numPollOptions--" :disable="numPollOptions == 2" />
            </div>

          </div>

        </div>


        <div class="buttonCluster">
          <ZKButton label="Submit" type="submit" />
          <ZKButton label="Reset" type="reset" color-flex="positive" class="q-ml-sm" />
        </div>

      </div>
    </q-form>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import PollingFormInputOption from "@/components/poll/PollingFormInputOption.vue";
import { useBottomSheet } from "@/utils/ui/bottomSheet";
import CommunityIcon from "@/components/community/CommunityIcon.vue";

const route = useRoute();
const router = useRouter();

const selectedCommunityId = ref("");

const { showCreatePostCommunitySelector } = useBottomSheet();

const postTitle = ref("");
const postBody = ref("");

const enablePolling = ref(false);
const pollingOption1 = ref("");
const pollingOption2 = ref("");
const pollingOption3 = ref("");
const pollingOption4 = ref("");
const pollingOption5 = ref("");
const pollingOption6 = ref("");
const numPollOptions = ref(2);

initialize();

function openCommunitySheet() {
  showCreatePostCommunitySelector(false, selectedCommunityId);
}

function initialize() {
  onReset();
}

function onSubmit() {
  router.push({ name: "single-post", params: { postSlugId: "asdf" } })
}

function onReset() {
  postTitle.value = "";
  postBody.value = "";
  enablePolling.value = false;

  const initialCommunityId = route.params.communityId;
  if (typeof initialCommunityId == "string") {
    selectedCommunityId.value = initialCommunityId;
  }

}

</script>

<style scoped lang="scss">
.header {
  font-size: 1.1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.formStyle {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.formElement {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.buttonCluster {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.communityButton {
  display: flex;
  font-size: 1rem;
  align-items: center;
  gap: 1rem;
  padding: 0.2rem;
}
</style>