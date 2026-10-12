import { describe, expect, it } from "vitest";
import {
    createSeedSuggestionUsageTracker,
    CONSUME_ISSUED_SEED_SUGGESTION_SCRIPT,
} from "./seedSuggestionUsage.js";
import { Script } from "@valkey/valkey-glide";

describe("seed suggestion analytics ownership", () => {
    it("rejects forged owners and identifiers, counts an issued suggestion only once, and expires it", async () => {
        let now = 0;
        const tracker = createSeedSuggestionUsageTracker({
            getValkey: () => undefined,
            consumeScript: new Script(CONSUME_ISSUED_SEED_SUGGESTION_SCRIPT),
            now: () => now,
        });
        const userId = crypto.randomUUID();
        const draftId = crypto.randomUUID();
        const generationId = crypto.randomUUID();
        const suggestionId = crypto.randomUUID();
        const request = { draftId, generationId, suggestionId };
        await tracker.registerIssuedSuggestions({
            userId,
            draftId,
            response: {
                generationId,
                confident: true,
                suggestions: [{ suggestionId, text: "Run night buses." }],
            },
        });
        expect(
            await tracker.consumeIssuedSuggestion({
                userId: crypto.randomUUID(),
                request,
            }),
        ).toBe(false);
        expect(
            await tracker.consumeIssuedSuggestion({
                userId,
                request: { ...request, draftId: crypto.randomUUID() },
            }),
        ).toBe(false);
        expect(
            await tracker.consumeIssuedSuggestion({
                userId,
                request: { ...request, generationId: crypto.randomUUID() },
            }),
        ).toBe(false);
        expect(await tracker.consumeIssuedSuggestion({ userId, request })).toBe(
            true,
        );
        expect(await tracker.consumeIssuedSuggestion({ userId, request })).toBe(
            false,
        );
        await tracker.registerIssuedSuggestions({
            userId,
            draftId,
            response: {
                generationId,
                confident: true,
                suggestions: [{ suggestionId, text: "Run night buses." }],
            },
        });
        now = 24 * 60 * 60 * 1000;
        expect(await tracker.consumeIssuedSuggestion({ userId, request })).toBe(
            false,
        );
    });
});
