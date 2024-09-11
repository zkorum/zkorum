<template>
  <div>
    <form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false">
      <q-editor v-model="commentText" placeholder="Add a comment" min-height="2rem" flat ref="editorRef" :toolbar="[
        ['bold', 'italic', 'strike', 'underline'],
        ['undo', 'redo']
      ]" @paste="onPaste" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const editorRef = ref();

const commentText = ref("");
const modelText = defineModel();

watch(commentText, () => {
  modelText.value = commentText.value;
})

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


</script>