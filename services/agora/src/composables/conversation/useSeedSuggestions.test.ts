import { uid } from "quasar";
import type { GenerateSeedSuggestionsRequest } from "src/shared/types/dto";
import type { GenerateSeedSuggestionsResult } from "src/utils/api/seedSuggestion/seedSuggestion";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, effectScope, ref, toRef } from "vue";

import { createEmptyDraft } from "./draft/conversationDraft.utils";
import {
  buildExistingStatements,
  plainTextToStatementHtml,
  useSeedSuggestions,
} from "./useSeedSuggestions";

const mocks = vi.hoisted(() => ({
  generateSeedSuggestions: vi.fn(
    (_params: {
      request: GenerateSeedSuggestionsRequest;
      turnstileToken: string | undefined;
      signal: AbortSignal;
    }) =>
      Promise.resolve<GenerateSeedSuggestionsResult>({
        status: "error",
        reason: "failed",
      })
  ),
  recordSeedSuggestionUse: vi.fn(),
}));

vi.mock("src/utils/api/seedSuggestion/seedSuggestion", () => ({
  useBackendSeedSuggestionApi: () => ({
    generateSeedSuggestions: mocks.generateSeedSuggestions,
    recordSeedSuggestionUse: mocks.recordSeedSuggestionUse,
  }),
}));
vi.mock("src/stores/user", () => ({
  useUserStore: () => ({
    profileData: { organizationList: [] },
    loadUserProfile: () => Promise.resolve(),
  }),
}));

describe("plainTextToStatementHtml", () => {
  it("wraps the text in a paragraph", () => {
    expect(
      plainTextToStatementHtml("Night buses should run on weekdays.")
    ).toBe("<p>Night buses should run on weekdays.</p>");
  });

  it("escapes characters that would otherwise be read as HTML", () => {
    expect(
      plainTextToStatementHtml("Fares < 2€ & free for <b>students</b>")
    ).toBe("<p>Fares &lt; 2€ &amp; free for &lt;b&gt;students&lt;/b&gt;</p>");
  });
});

describe("buildExistingStatements", () => {
  it("sends the author's statements as plain text, then earlier suggestions", () => {
    expect(
      buildExistingStatements({
        seedOpinions: ["<p>Run every <strong>30</strong> minutes.</p>"],
        suggestionHistory: ["Add security staff.", "Light the stops."],
      })
    ).toEqual([
      "Run every 30 minutes.",
      "Add security staff.",
      "Light the stops.",
    ]);
  });

  it("leaves out empty statements and repeats", () => {
    expect(
      buildExistingStatements({
        seedOpinions: ["", "<p></p>", "<p>Light the stops.</p>"],
        suggestionHistory: ["Light the stops.", "  "],
      })
    ).toEqual(["Light the stops."]);
  });

  it("stays within what the API accepts", () => {
    const statements = buildExistingStatements({
      seedOpinions: [],
      suggestionHistory: [
        "x".repeat(1500),
        ...Array.from({ length: 150 }, (_, index) => `Suggestion ${index}`),
      ],
    });

    expect(statements).toHaveLength(100);
    expect(statements.every((statement) => statement.length <= 1000)).toBe(
      true
    );
    expect(statements.at(-1)).toBe("Suggestion 149");
  });
});

let suggestionCounter = 0;

function confidentAnswer(texts: string[]): GenerateSeedSuggestionsResult {
  const generationId = uid();
  return {
    status: "success",
    data: {
      generationId,
      confident: true,
      suggestions: texts.map((text) => {
        suggestionCounter += 1;
        return {
          suggestionId: `suggestion-${String(suggestionCounter)}`,
          text,
        };
      }),
    },
  };
}

function setUp(seedOpinions: string[] = []) {
  const conversationDraft = ref({
    ...createEmptyDraft(),
    title: "Night buses",
    seedOpinions,
  });
  const disabled = ref(false);
  return {
    conversationDraft,
    disabled,
    suggestions: useSeedSuggestions({
      context: conversationDraft,
      opinions: toRef(conversationDraft.value, "seedOpinions"),
      existingOpinions: ref([]),
      disabled,
    }),
  };
}

describe("useSeedSuggestions", () => {
  it("cancels generation when submission starts and does not accept its result after submission fails", async () => {
    let resolve: ((result: GenerateSeedSuggestionsResult) => void) | undefined;
    mocks.generateSeedSuggestions.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const { disabled, suggestions } = setUp();
    const generating = suggestions.generate();
    await vi.waitFor(() =>
      expect(mocks.generateSeedSuggestions).toHaveBeenCalled()
    );
    const params = mocks.generateSeedSuggestions.mock.calls.at(-1)?.[0];
    disabled.value = true;
    expect(params?.signal.aborted).toBe(true);
    disabled.value = false;
    resolve?.(confidentAnswer(["Stale statement."]));
    expect(await generating).toEqual({ status: "skipped" });
    expect(suggestions.pendingSuggestions.value).toEqual([]);
  });
  it("ignores a generation for a draft that changed while awaiting the model", async () => {
    let resolve: ((result: GenerateSeedSuggestionsResult) => void) | undefined;
    mocks.generateSeedSuggestions.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const { conversationDraft, suggestions } = setUp();
    const generating = suggestions.generate("challenge-token");
    await vi.waitFor(() =>
      expect(mocks.generateSeedSuggestions).toHaveBeenCalled()
    );
    const params = mocks.generateSeedSuggestions.mock.calls.at(-1)?.[0];
    expect(params?.turnstileToken).toBe("challenge-token");
    conversationDraft.value.title = "Different topic";
    expect(params?.signal.aborted).toBe(true);
    resolve?.(confidentAnswer(["Stale statement."]));
    await generating;
    expect(suggestions.pendingSuggestions.value).toEqual([]);
  });

  it("ignores late results while disabled and blocks Add and Discard", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["Kept statement."])
    );
    const { disabled, conversationDraft, suggestions } = setUp();
    await suggestions.generate();
    const id = suggestions.pendingSuggestions.value.at(0)?.suggestionId ?? "";
    let resolve: ((result: GenerateSeedSuggestionsResult) => void) | undefined;
    mocks.generateSeedSuggestions.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const generating = suggestions.generate();
    await vi.waitFor(() =>
      expect(mocks.generateSeedSuggestions).toHaveBeenCalledTimes(2)
    );
    disabled.value = true;
    suggestions.add(id);
    expect(conversationDraft.value.seedOpinions).toEqual([]);
    suggestions.discard(id);
    resolve?.(confidentAnswer(["Late statement."]));
    await generating;
    expect(
      suggestions.pendingSuggestions.value.map((item) => item.text)
    ).toEqual(["Kept statement."]);
  });

  it("does not add a suggestion duplicated by an author while generation was in flight", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["Light the stops."])
    );
    const { conversationDraft, suggestions } = setUp();
    await suggestions.generate();
    conversationDraft.value.seedOpinions.push("<p> light   THE stops. </p>");
    suggestions.add(
      suggestions.pendingSuggestions.value.at(0)?.suggestionId ?? ""
    );
    expect(conversationDraft.value.seedOpinions).toHaveLength(1);
  });

  beforeEach(() => {
    mocks.generateSeedSuggestions.mockReset();
    mocks.recordSeedSuggestionUse.mockReset();
  });

  it("adds a suggestion to the statements and records it with the draft", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["Run every 30 minutes.", "Light the stops."])
    );
    const { conversationDraft, suggestions } = setUp(["<p>Mine.</p>"]);

    await suggestions.generate();
    const [first] = suggestions.pendingSuggestions.value;
    suggestions.add(first?.suggestionId ?? "");

    expect(conversationDraft.value.seedOpinions).toEqual([
      "<p>Mine.</p>",
      "<p>Run every 30 minutes.</p>",
    ]);
    expect(suggestions.pendingSuggestions.value.map((s) => s.text)).toEqual([
      "Light the stops.",
    ]);
    expect(mocks.recordSeedSuggestionUse).toHaveBeenCalledWith({
      draftId: conversationDraft.value.aiSuggestionDraftId,
      generationId: first?.generationId,
      suggestionId: first?.suggestionId,
    });
  });

  it("discards a suggestion without touching the statements or the log", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["Run every 30 minutes."])
    );
    const { conversationDraft, suggestions } = setUp();

    await suggestions.generate();
    suggestions.discard(
      suggestions.pendingSuggestions.value[0]?.suggestionId ?? ""
    );

    expect(suggestions.pendingSuggestions.value).toEqual([]);
    expect(conversationDraft.value.seedOpinions).toEqual([]);
    expect(mocks.recordSeedSuggestionUse).not.toHaveBeenCalled();
  });

  it("adds a second generation to the box and sends what was already shown", async () => {
    mocks.generateSeedSuggestions
      .mockResolvedValueOnce(confidentAnswer(["First."]))
      .mockResolvedValueOnce(confidentAnswer(["Second."]));
    const { conversationDraft, suggestions } = setUp();

    await suggestions.generate();
    suggestions.discard(
      suggestions.pendingSuggestions.value[0]?.suggestionId ?? ""
    );
    await suggestions.generate();

    expect(suggestions.pendingSuggestions.value.map((s) => s.text)).toEqual([
      "Second.",
    ]);
    expect(mocks.generateSeedSuggestions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          draftId: conversationDraft.value.aiSuggestionDraftId,
          existingStatements: ["First."],
        }),
      })
    );
  });

  it("shows the tip and blocks new requests when the model is not confident", async () => {
    mocks.generateSeedSuggestions
      .mockResolvedValueOnce(confidentAnswer(["Kept."]))
      .mockResolvedValueOnce({
        status: "success",
        data: {
          generationId: uid(),
          confident: false,
          tip: "Say which city this is about.",
        },
      });
    const { suggestions } = setUp();

    await suggestions.generate();
    await suggestions.generate();

    expect(suggestions.clarificationGuidance.value).toBe(
      "Say which city this is about."
    );
    expect(suggestions.pendingSuggestions.value.map((s) => s.text)).toEqual([
      "Kept.",
    ]);
    expect(suggestions.canGenerate.value).toBe(false);
    await suggestions.generate();
    expect(mocks.generateSeedSuggestions).toHaveBeenCalledTimes(2);
  });

  it("stops offering suggestions above 20 statements", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => `<p>${String(i)}</p>`);
    const { conversationDraft, suggestions } = setUp(twenty);

    expect(suggestions.canGenerate.value).toBe(true);
    conversationDraft.value.seedOpinions.push("<p>21</p>");
    expect(suggestions.canGenerate.value).toBe(false);
  });

  it("includes existing statements during editing and prevents adding duplicates after an edit", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["Existing statement.", "New suggestion."])
    );
    const conversationDraft = ref({
      ...createEmptyDraft(),
      title: "Night buses",
      seedOpinions: ["<p>New statement.</p>"],
    });
    const existingOpinions = ref(["<p>Existing statement.</p>"]);
    const suggestions = useSeedSuggestions({
      context: conversationDraft,
      opinions: toRef(conversationDraft.value, "seedOpinions"),
      existingOpinions,
      disabled: ref(false),
    });

    await suggestions.generate();
    expect(mocks.generateSeedSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          existingStatements: ["Existing statement.", "New statement."],
        }),
      })
    );
    expect(
      suggestions.pendingSuggestions.value.map((item) => item.text)
    ).toEqual(["New suggestion."]);

    existingOpinions.value = ["<p>New suggestion.</p>"];
    suggestions.add(
      suggestions.pendingSuggestions.value[0]?.suggestionId ?? ""
    );
    expect(conversationDraft.value.seedOpinions).toEqual([
      "<p>New statement.</p>",
    ]);
    expect(mocks.recordSeedSuggestionUse).not.toHaveBeenCalled();

    existingOpinions.value = Array.from(
      { length: 20 },
      (_, index) => `<p>Existing ${String(index)}</p>`
    );
    expect(suggestions.canGenerate.value).toBe(false);
  });

  it("stops adding suggestions at 50 statements", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["One too many."])
    );
    const { conversationDraft, suggestions } = setUp();
    await suggestions.generate();
    conversationDraft.value.seedOpinions = Array.from(
      { length: 50 },
      (_, i) => `<p>${String(i)}</p>`
    );

    expect(suggestions.canAddSuggestion.value).toBe(false);
    suggestions.add(
      suggestions.pendingSuggestions.value[0]?.suggestionId ?? ""
    );
    expect(conversationDraft.value.seedOpinions).toHaveLength(50);
  });

  it("updates the statements through their setter without mutating the source array", async () => {
    mocks.generateSeedSuggestions.mockResolvedValueOnce(
      confidentAnswer(["New suggestion."])
    );
    const original = ["<p>Original statement.</p>"];
    const statements = ref(original);
    const update = vi.fn((value: string[]) => {
      statements.value = value;
    });
    const suggestions = useSeedSuggestions({
      context: ref(createEmptyDraft()),
      opinions: computed({ get: () => statements.value, set: update }),
      existingOpinions: ref([]),
      disabled: ref(false),
    });

    await suggestions.generate();
    suggestions.add(
      suggestions.pendingSuggestions.value[0]?.suggestionId ?? ""
    );

    expect(update).toHaveBeenCalledWith([
      "<p>Original statement.</p>",
      "<p>New suggestion.</p>",
    ]);
    expect(original).toEqual(["<p>Original statement.</p>"]);
  });

  it("can start a new request immediately after a reset and ignores the old request's completion", async () => {
    let resolveFirst:
      | ((result: GenerateSeedSuggestionsResult) => void)
      | undefined;
    let resolveSecond:
      | ((result: GenerateSeedSuggestionsResult) => void)
      | undefined;
    mocks.generateSeedSuggestions
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        })
      );
    const { suggestions } = setUp();
    const first = suggestions.generate();
    await vi.waitFor(() =>
      expect(mocks.generateSeedSuggestions).toHaveBeenCalledTimes(1)
    );
    const firstSignal = mocks.generateSeedSuggestions.mock.calls[0]?.[0].signal;

    suggestions.reset();
    expect(firstSignal?.aborted).toBe(true);
    expect(suggestions.isGenerating.value).toBe(false);

    const second = suggestions.generate();
    await vi.waitFor(() =>
      expect(mocks.generateSeedSuggestions).toHaveBeenCalledTimes(2)
    );
    resolveFirst?.(confidentAnswer(["Stale suggestion."]));
    expect(await first).toEqual({ status: "skipped" });
    expect(suggestions.isGenerating.value).toBe(true);
    expect(suggestions.pendingSuggestions.value).toEqual([]);

    resolveSecond?.(confidentAnswer(["Current suggestion."]));
    expect(await second).toEqual({ status: "success" });
    expect(
      suggestions.pendingSuggestions.value.map((item) => item.text)
    ).toEqual(["Current suggestion."]);
    expect(suggestions.isGenerating.value).toBe(false);
  });

  it("aborts requests when the editor's scope is disposed", async () => {
    let resolve: ((result: GenerateSeedSuggestionsResult) => void) | undefined;
    mocks.generateSeedSuggestions.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const scope = effectScope();
    const setup = scope.run(() => setUp());
    if (setup === undefined) throw new Error("Missing test scope");
    const generating = setup.suggestions.generate();
    await vi.waitFor(() =>
      expect(mocks.generateSeedSuggestions).toHaveBeenCalledTimes(1)
    );
    const signal = mocks.generateSeedSuggestions.mock.calls[0]?.[0].signal;

    scope.stop();
    expect(signal?.aborted).toBe(true);
    resolve?.(confidentAnswer(["Late suggestion."]));
    expect(await generating).toEqual({ status: "skipped" });
    expect(setup.suggestions.pendingSuggestions.value).toEqual([]);
  });
});
