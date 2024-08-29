<template>
  <div>
    <div class="outerDiv">

      <q-form @submit=" onSubmit()">

        <TopMenuWrapper>
          <div class="topMenu">
            <ZKButton icon="mdi-close" text-color-flex="black" flat @click="router.back()" />

            <div class="submissionButtons">
              <HelpButton />
              <ZKButton label="Post" type="submit" />
            </div>
          </div>

        </TopMenuWrapper>

        <div class="container">
          <div class="communitySelector communityFlex">
            <div class="communityButton" @click="openCommunitySheet()">
              <CommunityIcon :community-id="selectedCommunityId" :show-country-name="false" :compact="true" />
              <div>
                a/{{ selectedCommunityId }}
              </div>

              <q-icon name="mdi-menu-down-outline" />
            </div>
          </div>

          <q-input borderless no-error-icon type="textarea" label="Title" v-model="postDraft.postTitle" lazy-rules
            :rules="[val => val && val.length > 0]" class="titleStyle" autogrow />

          <div>
            <div :class="{ editorPadding: !postDraft.enablePolling }">
              <q-editor v-model="postDraft.postBody" placeholder="body text" min-height="5rem" flat />
            </div>

            <ZKCard v-if="postDraft.enablePolling" class="pollingForm">
              <div class="pollingFlexStyle" ref="pollRef">
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

          </div>
        </div>
      </q-form>

      <div class="floatButton">
        <q-btn unelevated rounded :label="postDraft.enablePolling ? 'Remove Poll' : 'Add Poll'" icon="mdi-poll"
          color="accent" @click="togglePolling()" />
      </div>

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
  </div>

</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref } from "vue";
import { onBeforeRouteLeave, RouteLocationNormalized, useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import ZKCard from "@/components/ui-library/ZKCard.vue";
import TopMenuWrapper from "@/components/navigation/TopMenuWrapper.vue";
import HelpButton from "@/components/navigation/buttons/HelpButton.vue";
import { useBottomSheet } from "@/utils/ui/bottomSheet";
import CommunityIcon from "@/components/community/CommunityIcon.vue";
import { useNewPostDraftsStore } from "@/stores/newPostDrafts";

const router = useRouter();
const route = useRoute();

const pollRef = ref<HTMLElement | null>(null);

const showExitDialog = ref(false);

const selectedCommunityId = ref("");

const { showCreatePostCommunitySelector } = useBottomSheet();

const { postDraft, isPostEdited } = useNewPostDraftsStore();

let grantedRouteLeave = false;


loadCommunityId();

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

window.onbeforeunload = function () {
  if (isPostEdited()) {
    return "Changes that you made may not be saved.";
  }
}

onUnmounted(() => {
  window.onbeforeunload = () => { };
})

async function togglePolling() {
  postDraft.value.enablePolling = !postDraft.value.enablePolling;

  await nextTick();
  scrollToPoll();
}

function scrollToPoll() {
  if (postDraft.value.enablePolling) {
    pollRef.value?.scrollIntoView({ behavior: "smooth", "inline": "start" });
  }
}

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

function loadCommunityId() {
  const initialCommunityId = route.params.communityId;
  if (typeof initialCommunityId == "string") {
    selectedCommunityId.value = initialCommunityId;
  }
}

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
  padding-bottom: 6rem;
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

.submissionButtons {
  display: flex;
  gap: 1rem;
}

.floatButton {
  position: fixed;
  bottom: 2rem;
  left: calc(calc(100vw - calc(min(40rem, 100%))) / 2 + 1rem);
}

.scrollArea {
  height: 100%;
}

.outerDiv {
  position: relative;
}

.container {
  padding: 1rem;
}

.topMenu {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editorPadding {
  padding-bottom: 6rem;
}
</style>