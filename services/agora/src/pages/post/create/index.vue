<template>
  <div>
    <q-form @submit="onSubmit" class="container">
      <div class="formStyle">
        <div class="topbarFlex">
          <div class="communitySelector">
            <div class="communityButton" @click="openCommunitySheet()">
              <CommunityIcon :community-id="selectedCommunityId" :show-country-name="false" :compact="true" />
              <div>
                a/{{ selectedCommunityId }}
              </div>

              <q-icon name="mdi-menu-down-outline" />
            </div>
          </div>

          <ZKButton label="Post" type="submit" class="floatRight" />
        </div>

        <div class="formElement">
          <q-input borderless no-error-icon type="text" label="Title" v-model="postTitle" lazy-rules
            :rules="[val => val && val.length > 0]" class="titleStyle" />
        </div>

        <div class="formElement">
          <q-input autogrow borderless no-error-icon type="textarea" label="body text" v-model="postBody" lazy-rules />

          <ZKCard v-if="enablePolling" class="pollingForm">
            <div class="pollingFlexStyle">
              <div v-for="(item, index) in pollingOptionList" :key="index" class="pollingItem">
                <q-input :rules="[val => val && val.length > 0]" type="text" :label="'Poll Option ' + (index + 1)"
                  v-model="pollingOptionList[index]" :style="{ width: '100%', padding: '1rem' }" />
                <div :style="{ width: '2rem' }">
                  <ZKButton flat round icon="mdi-delete" @click="removePollOption(index)"
                    v-if="pollingOptionList.length != 2" text-color-flex="primary" />
                </div>

              </div>

              <div>
                <ZKButton flat text-color-flex="primary" label="Add Option" @click="addPollOption()"
                  :disable="pollingOptionList.length == 6" />
              </div>
            </div>
          </ZKCard>

        </div>

      </div>

      <q-btn outline rounded label="Poll" icon="mdi-poll" color="accent" @click="enablePolling = !enablePolling"
        class="floatingPollButton" />

    </q-form>

    <q-dialog v-model="showExitDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Alert</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum repellendus sit voluptate voluptas eveniet
          porro. Rerum blanditiis perferendis totam, ea at omnis vel numquam exercitationem aut, natus minima, porro
          labore.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import ZKCard from "@/components/ui-library/ZKCard.vue";
import { useBottomSheet } from "@/utils/ui/bottomSheet";
import CommunityIcon from "@/components/community/CommunityIcon.vue";

const router = useRouter();
const route = useRoute();

const showExitDialog = ref(false);

const selectedCommunityId = ref("");

const { showCreatePostCommunitySelector } = useBottomSheet();

const postTitle = ref("");
const postBody = ref("");

const enablePolling = ref(false);

const pollingOptionList = ref<string[]>(["", ""]);

onReset();

function addPollOption() {
  pollingOptionList.value.push("");
}

function removePollOption(index: number) {
  pollingOptionList.value.splice(index, 1);
}

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

/*
onBeforeRouteLeave(() => {
  window.confirm(
    "Do you really want to leave? you have unsaved changes!"
  )
})
  */

</script>

<style scoped lang="scss">
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
  position: absolute;
  right: 0;
}

.communityButton {
  display: flex;
  font-size: 1rem;
  align-items: center;
  gap: 1rem;
  padding: 0.2rem;
}

.pollingFlexStyle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.pollingItem {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.topbarFlex {
  display: flex;
  align-items: center;
}

.communitySelector {
  font-weight: bold;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-right: 0.5rem;
}

.communitySelector:hover {
  cursor: pointer;
}

.container {
  height: calc(100vh - 8rem);
  height: -webkit-fill-available;
  position: relative;
}

.floatingPollButton {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}
</style>