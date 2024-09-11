<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <q-editor v-model="commentText" placeholder="Add a comment" min-height="2rem" flat />
        <!--@update:model-value="checkWordCount()"-->
        <div class="postButton">
          <ZKButton label="Cancel" color-flex="secondary" @click="cancelClicked()" />
          <ZKButton label="Post" @click="postClicked()" />
        </div>
      </div>
    </WidthWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";

const emit = defineEmits(["cancelClicked", "postClicked"]);

const commentText = ref("");

function cancelClicked() {
  emit("cancelClicked")
}

function postClicked() {
  emit("postClicked");
}

</script>

<style scoped lang="scss">
.container {
  background-color: #d4d4d4;
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