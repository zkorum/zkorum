import { afterEach, describe, expect, it, vi } from "vitest";
import { Script } from "@valkey/valkey-glide";
import {
    Dto,
    type GenerateSeedSuggestionsRequest,
} from "@/shared/types/dto.js";
import { createSimulatedSeedSuggestionSource } from "./seedSuggestion.js";
import { createSeedSuggestionService } from "./seedSuggestionService.js";
import {
    createSeedSuggestionUsageTracker,
    CONSUME_ISSUED_SEED_SUGGESTION_SCRIPT,
} from "./seedSuggestionUsage.js";
import type { SeedSuggestionRateLimitResult } from "./seedSuggestionRateLimit.js";

const request: GenerateSeedSuggestionsRequest = {
    draftId: crypto.randomUUID(),
    conversationTitle: "Night buses",
    conversationType: "polis",
    existingStatements: [],
};
const scripts: Script[] = [];
afterEach(() => {
    for (const script of scripts) script.release();
    scripts.length = 0;
});

function setup({
    enabled = true,
    member = true,
    challenge = true,
    allowedUsers = "",
    rateLimit = { isAllowed: true },
}: {
    enabled?: boolean;
    member?: boolean;
    challenge?: boolean;
    allowedUsers?: string;
    rateLimit?: SeedSuggestionRateLimitResult;
} = {}) {
    const userId = crypto.randomUUID();
    const source = createSimulatedSeedSuggestionSource();
    const generate = vi.spyOn(source, "generate");
    const verifyChallenge = vi.fn(() => Promise.resolve(challenge));
    const consumeScript = new Script(CONSUME_ISSUED_SEED_SUGGESTION_SCRIPT);
    scripts.push(consumeScript);
    const service = createSeedSuggestionService({
        source: enabled ? source : undefined,
        access: { orgOnly: false, allowedOrgs: "", allowedUsers },
        isOrganizationMember: () => Promise.resolve(member),
        consumeRateLimit: () => Promise.resolve(rateLimit),
        verifyChallenge,
        usageTracker: createSeedSuggestionUsageTracker({
            getValkey: () => undefined,
            consumeScript,
        }),
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
    return { service, userId, generate, verifyChallenge };
}

describe("seed suggestion service", () => {
    it.each([
        { settings: { enabled: false }, reason: "disabled" },
        { settings: { member: false }, reason: "organization_not_available" },
        { settings: { challenge: false }, reason: "security_challenge_failed" },
        {
            settings: { allowedUsers: crypto.randomUUID() },
            reason: "not_available",
        },
    ])(
        "refuses inaccessible requests before calling a model: $reason",
        async ({ settings, reason }) => {
            const { service, userId, generate } = setup(settings);
            const result = await service.generate({
                userId,
                request:
                    settings.allowedUsers === undefined
                        ? {
                              ...request,
                              postAsOrganization: "test-organization",
                          }
                        : request,
                turnstileToken: undefined,
                signal: new AbortController().signal,
            });
            expect(result).toEqual({ success: false, reason });
            expect(generate).not.toHaveBeenCalled();
        },
    );

    it("returns retry metadata without consuming a challenge or calling a model", async () => {
        const { service, userId, generate, verifyChallenge } = setup({
            rateLimit: { isAllowed: false, retryAfterMs: 1500 },
        });
        const result = await service.generate({
            userId,
            request,
            turnstileToken: undefined,
            signal: new AbortController().signal,
        });
        expect(result).toEqual({
            success: false,
            reason: "rate_limited",
            retryAfterMs: 1500,
        });
        expect(verifyChallenge).not.toHaveBeenCalled();
        expect(generate).not.toHaveBeenCalled();
    });

    it("validates a challenge and returns a parsed response", async () => {
        const { service, userId, verifyChallenge } = setup();
        const result = await service.generate({
            userId,
            request,
            turnstileToken: "single-use-token",
            signal: new AbortController().signal,
        });
        expect(result.success).toBe(true);
        expect(verifyChallenge).toHaveBeenCalledWith("single-use-token");
        if (result.success)
            expect(
                Dto.generateSeedSuggestionsResponse.parse(result.response)
                    .confident,
            ).toBe(true);
    });

    it("does not accept analytics while the feature is disabled", async () => {
        const { service, userId } = setup({ enabled: false });
        expect(
            await service.recordAcceptance({
                userId,
                request: {
                    draftId: crypto.randomUUID(),
                    generationId: crypto.randomUUID(),
                    suggestionId: crypto.randomUUID(),
                },
            }),
        ).toEqual({ success: false, reason: "disabled" });
    });
});
