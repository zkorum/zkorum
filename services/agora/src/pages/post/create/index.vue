<template>
  <div>
    <div>
      <q-form @submit=" onSubmit()">

        <TopMenuWrapper :reveal="false">
          <div class="topMenu">
            <div class="menuFlexGroup">
              <ZKButton icon="mdi-close" text-color-flex="black" flat @click="router.back()" />

              <div class="communitySelector communityFlex">
                <div class="communityButton" @click="openCommunitySheet()">
                  <CommunityIcon />
                  <q-icon name="mdi-menu-down-outline" />
                </div>
              </div>
            </div>

            <div class="menuFlexGroup">
              <HelpButton />
              <ZKButton label="Post" type="submit" :disable="exceededBodyWordCount" />
            </div>
          </div>

        </TopMenuWrapper>

        <div class="container">
          <q-input borderless no-error-icon type="textarea" label="Title" v-model="postDraft.postTitle" lazy-rules
            :rules="[val => val && val.length > 0]" class="titleStyle" autogrow
            :counter="postDraft.postTitle.length > POST_TITLE_LENGTH_WARNING" :maxlength="POST_TITLE_LENGTH_MAX"
            clearable />

          <div>
            <div :class="{ editorPadding: !postDraft.enablePolling }">
              <q-editor v-model="postDraft.postBody" placeholder="body text" min-height="5rem" flat
                @update:model-value="checkWordCount()" />

              <div class="wordCountDiv" v-if="bodyWordCount > POST_BODY_LENGTH_WARNING">
                <q-icon name="mdi-alert-circle" v-if="bodyWordCount > POST_BODY_LENGTH_MAX"
                  class="bodySizeWarningIcon" />
                <span :class="{ wordCountWarning: bodyWordCount > POST_BODY_LENGTH_MAX }">{{
                  bodyWordCount }} </span> &nbsp; / {{ POST_BODY_LENGTH_MAX }}
              </div>
            </div>

            <ZKCard v-if="postDraft.enablePolling" class="pollingForm">
              <div class="pollPadding">
                <div class="pollTopBar">
                  <div>
                    Poll
                  </div>
                  <ZKButton flat text-color-flex="black" icon="mdi-close" @click="togglePolling()" />
                </div>
                <div class="pollingFlexStyle" ref="pollRef">
                  <div v-for="(item, index) in postDraft.pollingOptionList" :key="index" class="pollingItem">
                    <q-input :rules="[val => val && val.length > 0]" type="text" :label="'Option ' + (index + 1)"
                      v-model="postDraft.pollingOptionList[index]" :style="{ width: '100%' }"
                      :maxlength="POLL_OPTION_LENGTH_MAX" autogrow clearable />
                    <div class="deletePollOptionDiv" v-if="postDraft.pollingOptionList.length != 2">
                      <ZKButton flat round icon="mdi-delete" @click="removePollOption(index)"
                        text-color-flex="primary" />
                    </div>

                  </div>

                  <div>
                    <ZKButton flat text-color-flex="primary" icon="mdi-plus" label="Add Option" @click="addPollOption()"
                      :disable="postDraft.pollingOptionList.length == 6" />
                  </div>
                </div>
              </div>
            </ZKCard>

          </div>
        </div>

        <div ref="endOfForm">
        </div>
      </q-form>

      <div class="floatButton" :class="{ lessTransparency: postDraft.enablePolling }">
        <ZKButton unelevated rounded :label="postDraft.enablePolling ? 'Remove Poll' : 'Add Poll'" icon="mdi-poll"
          color-flex="grey-8" text-color-flex="white" @click="togglePolling()" />
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
import { onUnmounted, ref } from "vue";
import { onBeforeRouteLeave, RouteLocationNormalized, useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import ZKCard from "@/components/ui-library/ZKCard.vue";
import TopMenuWrapper from "@/components/navigation/TopMenuWrapper.vue";
import HelpButton from "@/components/navigation/buttons/HelpButton.vue";
import { useBottomSheet } from "@/utils/ui/bottomSheet";
import CommunityIcon from "@/components/community/CommunityIcon.vue";
import { useNewPostDraftsStore } from "@/stores/newPostDrafts";

const POST_BODY_LENGTH_MAX = 260;
const POST_BODY_LENGTH_WARNING = 200;
const POST_TITLE_LENGTH_MAX = 130;
const POST_TITLE_LENGTH_WARNING = 100;
const POLL_OPTION_LENGTH_MAX = 100;
const bodyWordCount = ref(0);
const exceededBodyWordCount = ref(false);

const router = useRouter();
const route = useRoute();

const pollRef = ref<HTMLElement | null>(null);
const endOfFormRef = ref<HTMLElement | null>();

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
function checkWordCount() {
  const div = document.createElement("div");
  div.innerHTML = postDraft.value.postBody;
  const text = div.innerText || "";
  bodyWordCount.value = text.length;

  if (bodyWordCount.value > POST_BODY_LENGTH_MAX) {
    exceededBodyWordCount.value = true;
  } else {
    exceededBodyWordCount.value = false;
  }

}

async function togglePolling() {
  postDraft.value.enablePolling = !postDraft.value.enablePolling;

  if (postDraft.value.enablePolling) {
    setTimeout(function () {
      pollRef.value?.scrollIntoView({ behavior: "smooth", "inline": "start" });
    }, 100);
  } else {
    setTimeout(function () {
      endOfFormRef.value?.scrollIntoView({ behavior: "smooth", "inline": "start" });
    }, 100);
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
  router.push({ name: "single-post", params: { postSlugId: "DUMMY_POST_SLUG_ID", communityId: "DUMMY_COMMUNITY_ID" } })
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
  gap: 0.8rem;
  width: 3rem;
}

.pollingFlexStyle {
  display: flex;
  flex-direction: column;
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
  color: black;
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

.menuFlexGroup {
  display: flex;
  gap: 1.5rem;
}

.floatButton {
  position: fixed;
  bottom: 2rem;
  left: calc(calc(100vw - calc(min(40rem, 100%))) / 2 + 1rem);
}

.scrollArea {
  height: 100%;
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

.wordCountDiv {
  display: flex;
  justify-content: right;
  align-items: center;
}

.wordCountWarning {
  color: $negative;
  font-weight: bold;
}

.bodySizeWarningIcon {
  font-size: 1rem;
  padding-right: 0.5rem;
}

.deletePollOptionDiv {
  width: 3rem;
  padding-bottom: 20px;
  padding-left: 1rem;
}

.lessTransparency {
  opacity: 0.8;
}

.pollTopBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: bold;
}

.pollPadding {
  padding: 1rem;
}
</style>