import type { DisplayedOpinionItem } from "src/shared/types/zod";
import {
  computed,
  type MaybeRefOrGetter,
  type Ref,
  shallowRef,
  toValue,
  watch,
} from "vue";

interface EditSession {
  readonly id: number;
  readonly opinion: DisplayedOpinionItem;
  readonly creationDraft: string;
}
interface ReadyEditSession extends EditSession {
  readonly kind: "ready";
  readonly baseline: string;
}
type ComposerMode =
  | { readonly kind: "creation" }
  | (EditSession & { readonly kind: "initializing" })
  | ReadyEditSession;

export function useOpinionComposerEditing({
  target,
  body,
  saveCreationDraft,
  activate,
  deactivate,
}: {
  target: MaybeRefOrGetter<DisplayedOpinionItem | undefined>;
  body: Ref<string>;
  saveCreationDraft: (body: string) => void;
  activate: () => void;
  deactivate: () => void;
}) {
  const mode = shallowRef<ComposerMode>({ kind: "creation" });
  let generation = 0;
  watch(
    () => {
      const opinion = toValue(target);
      return opinion === undefined
        ? undefined
        : `${opinion.opinionSlugId}:${opinion.displayContent.sourceVersion}`;
    },
    () => {
      const opinion = toValue(target);
      const previous = mode.value;
      generation += 1;
      if (opinion === undefined) {
        if (previous.kind === "creation") return;
        body.value = previous.creationDraft;
        mode.value = { kind: "creation" };
        deactivate();
        return;
      }
      const creationDraft =
        previous.kind === "creation" ? body.value : previous.creationDraft;
      if (previous.kind === "creation") saveCreationDraft(creationDraft);
      mode.value = {
        kind: "initializing",
        id: generation,
        opinion,
        creationDraft,
      };
      body.value = opinion.opinion;
      activate();
    },
    { immediate: true }
  );

  function ready(serializedContent: string): void {
    const current = mode.value;
    if (current.kind !== "initializing") return;
    body.value = serializedContent;
    mode.value = { ...current, kind: "ready", baseline: serializedContent };
  }
  function capture(): ReadyEditSession | undefined {
    return mode.value.kind === "ready" ? mode.value : undefined;
  }
  function isCurrent(session: ReadyEditSession): boolean {
    return mode.value.kind !== "creation" && mode.value.id === session.id;
  }
  return {
    isInitializing: computed(() => mode.value.kind === "initializing"),
    isDirty: computed(
      () => mode.value.kind === "ready" && body.value !== mode.value.baseline
    ),
    ready,
    capture,
    isCurrent,
  };
}
