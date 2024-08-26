<template>
  <div>
    <q-form @submit="onSubmit">
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

          <ZKButton label="Post" type="submit" class="floatRight" />
        </div>

        <div class="formElement">
          <q-input borderless no-error-icon type="text" label="Title" v-model="postTitle" lazy-rules
            :rules="[val => val && val.length > 0]" class="titleStyle" />
        </div>

        <div class="formElement">
          <q-input autogrow borderless no-error-icon type="textarea" label="Body text" v-model="postBody" lazy-rules />

          <ZKCard v-if="enablePolling" class="pollingForm">
            <div class="cardPadding">
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
          </ZKCard>

        </div>

      </div>
    </q-form>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="mdi-poll" color="accent" @click="enablePolling = !enablePolling" />
    </q-page-sticky>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import PollingFormInputOption from "@/components/poll/PollingFormInputOption.vue";
import ZKCard from "@/components/ui-library/ZKCard.vue";
import { useBottomSheet } from "@/utils/ui/bottomSheet";
import CommunityIcon from "@/components/community/CommunityIcon.vue";

const router = useRouter();
const route = useRoute();

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

onReset();

function openCommunitySheet() {
  showCreatePostCommunitySelector(false, selectedCommunityId);
}

function onSubmit() {
  router.push({ name: "single-post", params: { postSlugId: "asdf" } })
}

function onReset() {
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
  gap: 1rem;
  padding: 1rem;
}

.formElement {
  display: flex;
  flex-direction: column;
}

.floatRight {
  float: right;
}

.communityButton {
  display: flex;
  font-size: 1rem;
  align-items: center;
  gap: 1rem;
  padding: 0.2rem;
}

.cardPadding {
  padding: 1rem;
}

.buttonCluster {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.pollingForm {
  padding-top: 1rem;
}

.titleStyle {
  font-size: 1.2rem;
  font-weight: bold;
}
</style>