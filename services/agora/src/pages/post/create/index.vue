<template>
  <div>
    <q-form @submit="onSubmit()" class="container"
      :class="{ formHeightWebkit: Platform.is.safari, formHeightChromeium: !Platform.is.safari }">

      <div class="topMatter">

        <div class="topBar">
          <ZKButton icon="mdi-close" text-color-flex="black" flat @click="router.back()" />

          <div class="floatRight submissionButtons">
            <HelpButton />
            <ZKButton label="Post" type="submit" />
          </div>
        </div>

        <div class="communitySelector communityFlex">
          <div class="communityButton" @click="openCommunitySheet()">
            <CommunityIcon :community-id="selectedCommunityId" :show-country-name="false" :compact="true" />
            <div>
              a/{{ selectedCommunityId }}
            </div>

            <q-icon name="mdi-menu-down-outline" />
          </div>
        </div>

        <q-input borderless no-error-icon type="text" label="Title" v-model="postDraft.postTitle" lazy-rules
          :rules="[val => val && val.length > 0]" class="titleStyle" />

      </div>

      <div class="midMatter">
        <q-scroll-area class="scrollArea">
          <q-input autogrow borderless no-error-icon type="textarea" label="body text" v-model="postDraft.postBody"
            lazy-rules />

          <ZKCard v-if="postDraft.enablePolling" class="pollingForm">
            <div class="pollingFlexStyle">
              <div v-for="(item, index) in postDraft.pollingOptionList" :key="index" class="pollingItem">
                <q-input :rules="[val => val && val.length > 0]" type="text" :label="'Poll Option ' + (index + 1)"
                  v-model="postDraft.pollingOptionList[index]" :style="{ width: '100%', padding: '1rem' }" />
                <div :style="{ width: '2rem' }">
                  <ZKButton flat round icon="mdi-delete" @click="removePollOption(index)"
                    v-if="postDraft.pollingOptionList.length != 2" text-color-flex="primary" />
                </div>

              </div>

              <div>
                <ZKButton flat text-color-flex="primary" label="Add Option" @click="addPollOption()"
                  :disable="postDraft.pollingOptionList.length == 6" />
              </div>
            </div>
          </ZKCard>

        </q-scroll-area>
      </div>

      <div class="bottomMatter">
        <q-btn outline rounded :label="postDraft.enablePolling ? 'Remove Poll' : 'Add Poll'" icon="mdi-poll"
          color="accent" @click="postDraft.enablePolling = !postDraft.enablePolling" />
      </div>
    </q-form>

    <q-dialog v-model="showExitDialog">
      <ZKCard>
        <div class="exitDialogStyle">
          <div class="dialogTitle">Discard this post?</div>

          <div>Your drafted post will not be saved.</div>

          <div class="dialogButtons">
            <ZKButton flat label="Cancel" text-color-flex="primary" v-close-popup />
            <ZKButton label="Discard" v-close-popup @click="leaveRoute()" />
          </div>
        </div>
      </ZKCard>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { onBeforeRouteLeave, RouteLocationNormalized, useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import ZKCard from "@/components/ui-library/ZKCard.vue";
import HelpButton from "@/components/navigation/buttons/HelpButton.vue";
import { useBottomSheet } from "@/utils/ui/bottomSheet";
import CommunityIcon from "@/components/community/CommunityIcon.vue";
import { useNewPostDraftsStore } from "@/stores/newPostDrafts";
import { Platform } from "quasar";

const router = useRouter();
const route = useRoute();

const showExitDialog = ref(false);

const selectedCommunityId = ref("");

const { showCreatePostCommunitySelector } = useBottomSheet();

const { postDraft, isPostEdited } = useNewPostDraftsStore();

let grantedRouteLeave = false;


onReset();

window.onbeforeunload = function () {
  if (isPostEdited()) {
    return "Changes that you made may not be saved.";
  }
}

onUnmounted(() => {
  window.onbeforeunload = () => { };
})

function addPollOption() {
  postDraft.value.pollingOptionList.push("");
}

function removePollOption(index: number) {
  postDraft.value.pollingOptionList.splice(index, 1);
}

function openCommunitySheet() {
  showCreatePostCommunitySelector(false, selectedCommunityId);
}

function onSubmit() {
  grantedRouteLeave = true;
  router.push({ name: "single-post", params: { postSlugId: "asdf" } })
}

function onReset() {
  const initialCommunityId = route.params.communityId;
  if (typeof initialCommunityId == "string") {
    selectedCommunityId.value = initialCommunityId;
  }
}

let savedToRoute: RouteLocationNormalized = {
  matched: [],
  fullPath: "",
  query: {},
  hash: "",
  name: "",
  path: "",
  meta: {},
  params: {},
  redirectedFrom: undefined
};

function leaveRoute() {
  grantedRouteLeave = true;
  router.push(savedToRoute);
}

onBeforeRouteLeave((to) => {
  if (isPostEdited() && !grantedRouteLeave) {
    savedToRoute = to;
    showExitDialog.value = true;
    return false;
  } else {
    return true;
  }
})

</script>

<style scoped lang="scss">
.floatRight {
  position: absolute;
  right: 1rem;
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

.communityFlex {
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

.exitDialogStyle {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.dialogTitle {
  font-size: 1.4rem;
  font-weight: bold;
}

.dialogButtons {
  display: flex;
  justify-content: space-around;
}

.topBar {
  display: flex;
  align-items: center;
}

.submissionButtons {
  display: flex;
  gap: 1rem;
}

.formHeightWebkit {
  height: -webkit-fill-available;
}

.formHeightChromeium {
  height: 100vh;
}

.container {
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content auto min-content;
  gap: 0px 0px;
  grid-template-areas:
    "topMatter"
    "midMatter"
    "bottomMatter";
}

.topMatter {
  grid-area: topMatter;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.midMatter {
  grid-area: midMatter;
}

.bottomMatter {
  grid-area: bottomMatter;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.scrollArea {
  height: 100%;
}
</style>