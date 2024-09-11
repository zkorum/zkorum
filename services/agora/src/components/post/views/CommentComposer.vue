<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <ZKEditor v-model="commentText" placeholder="Add a comment" min-height="2rem" />
        <!--@update:model-value="checkWordCount()" -->
        <div class="actionBar">
          <div class="characterCountDiv">
            {{ commentText.length }} / {{ MAX_COMMENT_CHARACTERS }}
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
import { ref } from "vue";

const MAX_COMMENT_CHARACTERS = 280;

const commentText = ref("");

const emit = defineEmits(["cancelClicked", "postClicked"]);

function cancelClicked() {
  emit("cancelClicked")
}

function postClicked() {
  emit("postClicked");
}

</script>

<style scoped lang="scss">
.container {
  background-color: #e5e7eb;
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