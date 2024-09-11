<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <ZKEditor v-model="commentText" />
        <!--@update:model-value="checkWordCount()" -->
        <div class="postButton">
          <ZKButton label="Cancel" color="secondary" @click="cancelClicked()" />
          <ZKButton label="Post" color="primary" @click="postClicked()" />
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

.postButton {
  display: flex;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  justify-content: right;
  gap: 1rem;
}
</style>