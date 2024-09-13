<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <ZKEditor v-model="commentText" placeholder="Add a comment" min-height="2rem"
          @update:model-value="checkWordCount()" :focus-editor="showControls" @manually-focused="editorFocused()"
          :show-toolbar="innerFocus || showControls" :key="resetKey" />
        <div class="actionButtonCluster" v-if="innerFocus || showControls">
          <div v-if="characterProgress > 100">
            {{ MAX_COMMENT_CHARACTERS - characterCount }}
          </div>

          <q-circular-progress :value="characterProgress" size="1.5rem" :thickness="0.3" />

          <q-separator vertical inset />

          <ZKButton label="Cancel" color="secondary" @click="cancelClicked()" />
          <ZKButton label="Post" color="primary" @click="postClicked()" :disable="characterProgress > 100" />
        </div>
      </div>
    </WidthWrapper>
  </div>
</template>

<script setup lang="ts">
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import ZKEditor from "src/components/ui-library/ZKEditor.vue";
import { getCharacterCount } from "src/utils/component/editor";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  showControls: boolean
}>()

const innerFocus = ref(false);

const MAX_COMMENT_CHARACTERS = 280;

const characterProgress = computed(() => {
  return characterCount.value / MAX_COMMENT_CHARACTERS * 100;
})

const commentText = ref("");
const characterCount = ref(0);
const resetKey = ref(0);

const emit = defineEmits(["cancelClicked", "postClicked", "editorFocused"]);

watch(() => props.showControls, () => {
  if (props.showControls == false) {
    innerFocus.value = false;
  } else {
    innerFocus.value = true;
  }
})

function editorFocused() {
  innerFocus.value = true;
  emit("editorFocused");
}

function checkWordCount() {
  characterCount.value = getCharacterCount(commentText.value);
}

function cancelClicked() {
  emit("cancelClicked")
  innerFocus.value = false;
  resetKey.value = resetKey.value + 1;
  characterCount.value = 0;
}

function postClicked() {
  emit("postClicked");
  innerFocus.value = false;
  resetKey.value = resetKey.value + 1;
  characterCount.value = 0;
}

</script>

<style scoped lang="scss">
.container {
  background-color: #e5e5e5;
  padding: 0.5rem;
  border-radius: 5px;
}

.actionBar {
  display: flex;
  padding: 0.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: $color-text-weak;
}

.actionButtonCluster {
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 1rem;
  padding: 1rem;
}
</style>