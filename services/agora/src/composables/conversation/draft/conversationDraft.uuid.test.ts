import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("draft UUID browser compatibility", () => {
  it("creates valid, distinct draft IDs without native crypto.randomUUID", async () => {
    const nativeCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: nativeCrypto.getRandomValues.bind(nativeCrypto),
    });
    vi.resetModules();
    const { createEmptyDraft } = await import("./conversationDraft.utils");
    const first = createEmptyDraft();
    const second = createEmptyDraft();
    expect(z.uuid().safeParse(first.aiSuggestionDraftId).success).toBe(true);
    expect(z.uuid().safeParse(second.aiSuggestionDraftId).success).toBe(true);
    expect(first.aiSuggestionDraftId).not.toBe(second.aiSuggestionDraftId);
  });
});
