<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <ZKEditor v-model="commentText" placeholder="Add a comment" min-height="2rem"
          @update:model-value="checkWordCount()" :focus-editor="showControls" @manually-focused="innerFocus = true"
          :show-toolbar="innerFocus" :key="resetKey" />
        <div class="actionBar" v-if="innerFocus">
          <div class="characterCountDiv">
            {{ characterCount }} / {{ MAX_COMMENT_CHARACTERS }}
          </div>

          <div class="actionButtonCluster">
            <ZKButton label="Cancel" color="secondary" @click="cancelClicked()" />
            <ZKButton label="Post" color="primary" @click="postClicked()" />
          </div>

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
import { ref, watch } from "vue";

const props = defineProps<{
  showControls: boolean
}>()

const innerFocus = ref(false);

const MAX_COMMENT_CHARACTERS = 280;

const commentText = ref("");
const characterCount = ref(0);
const resetKey = ref(0);

const emit = defineEmits(["cancelClicked", "postClicked"]);

watch(() => props.showControls, () => {
  if (props.showControls == false) {
    innerFocus.value = false;
  } else {
    innerFocus.value = true;
  }
})

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
}

</script>

<style scoped lang="scss">
.container {
  background-color: #e2e8f0;
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
  gap: 1rem;
}

.characterCountDiv {
  font-size: 0.9rem;
}
</style>