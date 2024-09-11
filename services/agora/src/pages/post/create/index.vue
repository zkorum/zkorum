<template>
  <div>
    <div>
      <q-form @submit=" onSubmit()">
        <TopMenuWrapper :reveal="false">
          <div class="topMenu">
            <div class="menuFlexGroup">
              <ZKButton icon="mdi-close" text-color="black" flat @click="router.back()" />
            </div>

            <div class="menuFlexGroup">
              <HelpButton />
              <ZKButton color="primary" label="Post" type="submit" :disable="exceededBodyWordCount" />
            </div>
          </div>

        </TopMenuWrapper>

        <div class="container">

          <q-input borderless no-error-icon type="textarea" label="Title" v-model="postDraft.postTitle" lazy-rules
            :rules="[val => val && val.length > 0]" class="titleStyle" autogrow :maxlength="POST_TITLE_LENGTH_MAX"
            clearable />

          <div class="wordCountDiv">{{ postDraft.postTitle.length }} / {{ POST_TITLE_LENGTH_MAX }}</div>

          <div>
            <div :class="{ editorPadding: !postDraft.enablePolling }">
              <ZKEditor v-model="postDraft.postBody" placeholder="body text" min-height="5rem"
                @update:model-value="checkWordCount()" :focus-editor="false" :show-toolbar="true" />

              <div class="wordCountDiv">
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
                  <ZKButton flat text-color="black" icon="mdi-close" @click="togglePolling()" />
                </div>
                <div class="pollingFlexStyle" ref="pollRef">
                  <div v-for="index in postDraft.pollingOptionList.length" :key="index" class="pollingItem">
                    <q-input :rules="[val => val && val.length > 0]" type="text" :label="'Option ' + (index + 1)"
                      v-model="postDraft.pollingOptionList[index]" :style="{ width: '100%' }"
                      :maxlength="POLL_OPTION_LENGTH_MAX" autogrow clearable />
                    <div class="deletePollOptionDiv" v-if="postDraft.pollingOptionList.length != 2">
                      <ZKButton flat round icon="mdi-delete" @click="removePollOption(index)" text-color="primary" />
                    </div>

                  </div>

                  <div>
                    <ZKButton flat text-color="primary" icon="mdi-plus" label="Add Option" @click="addPollOption()"
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

      <div class="addPollBar" :class="{ lessTransparency: postDraft.enablePolling }"
        :style="{ top: (visualViewPortHeight - 50) + 'px' }">
        <ZKButton unelevated rounded :label="postDraft.enablePolling ? 'Remove Poll' : 'Add Poll'" icon="mdi-poll"
          color="grey-8" text-color="white" @click="togglePolling()" />
      </div>

      <q-dialog v-model="showExitDialog">
        <ZKCard>
          <div class="exitDialogStyle">
            <div class="dialogTitle">Discard this post?</div>

            <div>Your drafted post will not be saved.</div>

            <div class="dialogButtons">
              <ZKButton flat label="Cancel" text-color="primary" v-close-popup />
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
import { onBeforeRouteLeave, RouteLocationNormalized, useRouter } from "vue-router";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import TopMenuWrapper from "src/components/navigation/TopMenuWrapper.vue";
import HelpButton from "src/components/navigation/buttons/HelpButton.vue";
import ZKEditor from "src/components/ui-library/ZKEditor.vue";
import { useNewPostDraftsStore } from "src/stores/newPostDrafts";
import { useViewPorts } from "src/utils/html/viewPort";
import { usePostStore } from "src/stores/post";
import { getCharacterCount } from "src/utils/component/editor";

const POST_BODY_LENGTH_MAX = 260;
const POST_TITLE_LENGTH_MAX = 130;
const POLL_OPTION_LENGTH_MAX = 100;
const bodyWordCount = ref(0);
const exceededBodyWordCount = ref(false);

const router = useRouter();

const { visualViewPortHeight } = useViewPorts();

const pollRef = ref<HTMLElement | null>(null);
const endOfFormRef = ref<HTMLElement | null>();

const showExitDialog = ref(false);

const { postDraft, isPostEdited } = useNewPostDraftsStore();

let grantedRouteLeave = false;

const { submitNewPost } = usePostStore();

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

  bodyWordCount.value = getCharacterCount(postDraft.value.postBody);

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

function onSubmit() {
  grantedRouteLeave = true;

  const slugId = submitNewPost(postDraft.value.postTitle, postDraft.value.postBody);
  router.push({ name: "single-post", params: { postSlugId: slugId } })
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
.pollingFlexStyle {
  display: flex;
  flex-direction: column;
}

.pollingForm {
  padding-top: 1rem;
  padding-bottom: 6rem;
}

.titleStyle {
  font-size: 1.1rem;
  font-weight: bold;
}

.pollingItem {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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

.addPollBar {
  position: absolute;
  width: 100%;
  padding-right: 0.5rem;
  display: flex;
  justify-content: right;
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
  color: $color-text-weak;
  font-size: 0.8rem;
  font-weight: bold;
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