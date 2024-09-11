<template>
  <div>
    <WidthWrapper>
      <div class="container">
        <form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false">
          <q-editor v-model="commentText" placeholder="Add a comment" min-height="2rem" flat ref="editorRef" :toolbar="[
            ['bold', 'italic', 'strike', 'underline'],
            ['undo', 'redo']
          ]" @paste="onPaste" />
        </form>

        <!--@update:model-value="checkWordCount()"-->
        <div class="postButton">
          <ZKButton label="Cancel" color="secondary" @click="cancelClicked()" />
          <ZKButton label="Post" color="primary" @click="postClicked()" />
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

const editorRef = ref();

function onPaste(evt: Event) {
  // Let inputs do their thing, so we don't break pasting of links.
  /* @ts-expect-error Event definition is missing */
  if (evt.target?.nodeName === "INPUT") return
  let text, onPasteStripFormattingIEPaste
  evt.preventDefault()
  evt.stopPropagation()
  /* @ts-expect-error Event definition is missing */
  if (evt.originalEvent && evt.originalEvent.clipboardData.getData) {
    /* @ts-expect-error Event definition is missing */
    text = evt.originalEvent.clipboardData.getData("text/plain")
    editorRef.value.runCmd("insertText", text)
  }
  /* @ts-expect-error Event definition is missing */
  else if (evt.clipboardData && evt.clipboardData.getData) {
    /* @ts-expect-error Event definition is missing */
    text = evt.clipboardData.getData("text/plain")
    editorRef.value.runCmd("insertText", text)
  }
  /* @ts-expect-error Definition is missing */
  else if (window.clipboardData && window.clipboardData.getData) {
    if (!onPasteStripFormattingIEPaste) {
      onPasteStripFormattingIEPaste = true
      editorRef.value.runCmd("ms-pasteTextOnly", text)
    }
    onPasteStripFormattingIEPaste = false
  }
}

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