import { computed, shallowRef } from "vue";

import type { OpinionEditRequest } from "./types";

export function useOpinionEditTarget() {
  const editingTarget = shallowRef<OpinionEditRequest>();

  function beginEditOpinion(request: OpinionEditRequest): void {
    if (editingTarget.value === undefined) editingTarget.value = request;
  }

  function finishEditOpinion(): void {
    editingTarget.value = undefined;
  }

  return {
    editingTarget: computed(() => editingTarget.value),
    editingOpinion: computed(() => editingTarget.value?.opinion),
    beginEditOpinion,
    finishEditOpinion,
  };
}
