import type { ConversationDraft } from "src/composables/conversation/draft/conversationDraft.types";
import { resolveDraftPublicationIdentityAtBoundary } from "src/composables/conversation/draft/conversationDraft.utils";
import { htmlToCountedText } from "src/shared/richText";
import {
  getSeedOpinionComparisonKey,
  MAX_SEED_OPINIONS_PER_SUBMISSION,
} from "src/shared/seedOpinions";
import {
  type GenerateSeedSuggestionsResponse,
  MAX_LENGTH_SEED_SUGGESTION_EXISTING_STATEMENT,
  MAX_SEED_SUGGESTION_EXISTING_STATEMENTS,
  SEED_SUGGESTION_TARGET_COUNT,
} from "src/shared/types/dto";
import { useUserStore } from "src/stores/user";
import { getErrorLogContext } from "src/utils/api/errorLog";
import {
  type GenerateSeedSuggestionsFailure,
  useBackendSeedSuggestionApi,
} from "src/utils/api/seedSuggestion/seedSuggestion";
import {
  computed,
  getCurrentScope,
  onScopeDispose,
  type Ref,
  ref,
  watch,
} from "vue";

/** Above this many statements on the page, AI suggestions are no longer offered. */
export const MAX_STATEMENTS_FOR_SEED_SUGGESTIONS = 20;

/** An AI suggestion shown in the Suggestions box, not yet acted on. */
type ConfidentSeedSuggestionsResponse = Extract<
  GenerateSeedSuggestionsResponse,
  { confident: true }
>;
export type SeedSuggestionItem = Readonly<
  ConfidentSeedSuggestionsResponse["suggestions"][number] &
    Pick<ConfidentSeedSuggestionsResponse, "generationId">
>;

/** Turns a plain-text suggestion into the HTML a statement editor holds. */
export function plainTextToStatementHtml(text: string): string {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<p>${escaped}</p>`;
}

/**
 * Plain text of everything already on the page, sent with a request so that new
 * suggestions do not repeat it: the author's statements, then earlier suggestions.
 */
export function buildExistingStatements({
  seedOpinions,
  suggestionHistory,
}: {
  seedOpinions: readonly string[];
  suggestionHistory: readonly string[];
}): string[] {
  const seeds = seedOpinions.map(htmlToCountedText);
  const historyCapacity = Math.max(
    0,
    MAX_SEED_SUGGESTION_EXISTING_STATEMENTS - seeds.length
  );
  const history =
    historyCapacity === 0 ? [] : suggestionHistory.slice(-historyCapacity);
  const seen = new Set<string>();
  return [...seeds, ...history]
    .map((text) =>
      text.trim().slice(0, MAX_LENGTH_SEED_SUGGESTION_EXISTING_STATEMENT)
    )
    .filter((text) => {
      const key = getSeedOpinionComparisonKey(text);
      if (key === "" || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SEED_SUGGESTION_EXISTING_STATEMENTS);
}

/**
 * AI suggestions for the seed statements of a conversation draft.
 *
 * Everything here lives on the page only: suggestions are lost when the author
 * leaves. A suggestion enters the draft only when the author adds it as a statement.
 */
export function useSeedSuggestions({
  conversationDraft,
  disabled,
}: {
  conversationDraft: Ref<ConversationDraft>;
  disabled: Readonly<Ref<boolean>>;
}) {
  const userStore = useUserStore();
  const { generateSeedSuggestions, recordSeedSuggestionUse } =
    useBackendSeedSuggestionApi();

  const pendingSuggestions = ref<SeedSuggestionItem[]>([]);
  const suggestionHistory = ref<string[]>([]);
  const clarificationGuidance = ref<string>();
  const isGenerating = ref(false);
  let generationAbortController: AbortController | undefined;
  let draftRevision = 0;
  watch(
    [
      () => conversationDraft.value.aiSuggestionDraftId,
      () => conversationDraft.value.title,
      () => conversationDraft.value.content,
      () => conversationDraft.value.postAs,
      () => conversationDraft.value.conversationType,
      () => conversationDraft.value.externalSourceConfig,
    ],
    () => {
      draftRevision += 1;
      generationAbortController?.abort();
      pendingSuggestions.value = [];
      suggestionHistory.value = [];
      clarificationGuidance.value = undefined;
    },
    { deep: true, flush: "sync" }
  );
  watch(
    disabled,
    (isDisabled) => {
      if (isDisabled) {
        draftRevision += 1;
        generationAbortController?.abort();
      }
    },
    { flush: "sync" }
  );
  if (getCurrentScope() !== undefined)
    onScopeDispose(() => {
      draftRevision += 1;
      generationAbortController?.abort();
    });

  const statementCount = computed(
    () => conversationDraft.value.seedOpinions.length
  );
  const canGenerate = computed(
    () =>
      !isGenerating.value &&
      !disabled.value &&
      clarificationGuidance.value === undefined &&
      conversationDraft.value.externalSourceConfig === null &&
      pendingSuggestions.value.length <=
        MAX_SEED_SUGGESTION_EXISTING_STATEMENTS -
          SEED_SUGGESTION_TARGET_COUNT &&
      statementCount.value <= MAX_STATEMENTS_FOR_SEED_SUGGESTIONS
  );
  const canAddSuggestion = computed(
    () =>
      !disabled.value && statementCount.value < MAX_SEED_OPINIONS_PER_SUBMISSION
  );

  async function generate(
    turnstileToken?: string
  ): Promise<
    | { status: "success" | "skipped" }
    | { status: "error"; reason: GenerateSeedSuggestionsFailure }
  > {
    if (!canGenerate.value) {
      return { status: "skipped" };
    }
    isGenerating.value = true;
    const requestDraftRevision = draftRevision;
    const controller = new AbortController();
    generationAbortController = controller;
    try {
      const draft = conversationDraft.value;
      const identity = await resolveDraftPublicationIdentityAtBoundary({
        postAs: draft.postAs,
        getProfile: () => userStore.profileData,
        loadProfile: userStore.loadUserProfile,
      });
      if (identity.status !== "resolved") {
        return { status: "error", reason: "not_available" };
      }
      if (draftRevision !== requestDraftRevision || disabled.value)
        return { status: "skipped" };

      const result = await generateSeedSuggestions({
        turnstileToken,
        signal: controller.signal,
        request: {
          draftId: draft.aiSuggestionDraftId,
          conversationTitle: draft.title,
          conversationBody: draft.content === "" ? undefined : draft.content,
          conversationType: draft.conversationType,
          postAsOrganization: identity.organizationSlug,
          existingStatements: buildExistingStatements({
            seedOpinions: draft.seedOpinions,
            suggestionHistory: suggestionHistory.value,
          }),
        },
      });
      if (draftRevision !== requestDraftRevision || disabled.value)
        return { status: "skipped" };
      if (result.status === "error") {
        return { status: "error", reason: result.reason };
      }

      const { data } = result;
      if (!data.confident) {
        clarificationGuidance.value = data.tip;
        return { status: "success" };
      }
      const existing = new Set(
        buildExistingStatements({
          seedOpinions: conversationDraft.value.seedOpinions,
          suggestionHistory: suggestionHistory.value,
        }).map(getSeedOpinionComparisonKey)
      );
      const newSuggestions = data.suggestions
        .filter((suggestion) => {
          const key = getSeedOpinionComparisonKey(suggestion.text);
          if (existing.has(key)) return false;
          existing.add(key);
          return true;
        })
        .map((suggestion) => ({
          generationId: data.generationId,
          suggestionId: suggestion.suggestionId,
          text: suggestion.text,
        }));
      pendingSuggestions.value = [
        ...pendingSuggestions.value,
        ...newSuggestions,
      ];
      suggestionHistory.value = [
        ...suggestionHistory.value,
        ...newSuggestions.map((suggestion) => suggestion.text),
      ].slice(-MAX_SEED_SUGGESTION_EXISTING_STATEMENTS);
      return { status: "success" };
    } catch (error) {
      if (draftRevision !== requestDraftRevision || disabled.value)
        return { status: "skipped" };
      console.warn(
        "Seed suggestion state update failed",
        getErrorLogContext(error)
      );
      return { status: "error", reason: "failed" };
    } finally {
      generationAbortController = undefined;
      isGenerating.value = false;
    }
  }

  function removeFromBox(suggestionId: string): SeedSuggestionItem | undefined {
    const suggestion = pendingSuggestions.value.find(
      (item) => item.suggestionId === suggestionId
    );
    pendingSuggestions.value = pendingSuggestions.value.filter(
      (item) => item.suggestionId !== suggestionId
    );
    return suggestion;
  }

  /**
   * Moves a suggestion out of the box and into the draft's statements, where the
   * author can edit it like any other. Returns the position of the new statement,
   * or undefined if nothing was added.
   */
  function add(suggestionId: string): number | undefined {
    if (!canAddSuggestion.value) {
      return undefined;
    }
    const suggestion = removeFromBox(suggestionId);
    if (suggestion === undefined) {
      return undefined;
    }
    const key = getSeedOpinionComparisonKey(suggestion.text);
    if (
      conversationDraft.value.seedOpinions.some(
        (html) => getSeedOpinionComparisonKey(htmlToCountedText(html)) === key
      )
    )
      return undefined;
    conversationDraft.value.seedOpinions.push(
      plainTextToStatementHtml(suggestion.text)
    );
    void recordSeedSuggestionUse({
      draftId: conversationDraft.value.aiSuggestionDraftId,
      generationId: suggestion.generationId,
      suggestionId: suggestion.suggestionId,
    });
    return conversationDraft.value.seedOpinions.length - 1;
  }

  function discard(suggestionId: string): void {
    if (!disabled.value) removeFromBox(suggestionId);
  }

  return {
    pendingSuggestions,
    clarificationGuidance,
    isGenerating,
    canGenerate,
    canAddSuggestion,
    generate,
    add,
    discard,
  };
}
