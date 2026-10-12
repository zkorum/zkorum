import { type Script, TimeUnit } from "@valkey/valkey-glide";
import { z } from "zod";
import type { Valkey } from "@/shared-backend/valkey.js";
import type {
    GenerateSeedSuggestionsResponse,
    RecordSeedSuggestionUseRequest,
} from "@/shared/types/dto.js";

const ISSUED_SUGGESTION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_IN_MEMORY_ISSUED_SUGGESTIONS = 10_000;
export const CONSUME_ISSUED_SEED_SUGGESTION_SCRIPT = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('DEL', KEYS[1])
return 1
`;

export interface SeedSuggestionUsageTracker {
    readonly registerIssuedSuggestions: (params: {
        userId: string;
        draftId: string;
        response: GenerateSeedSuggestionsResponse;
    }) => Promise<void>;
    readonly consumeIssuedSuggestion: (params: {
        userId: string;
        request: RecordSeedSuggestionUseRequest;
    }) => Promise<boolean>;
}

export function createSeedSuggestionUsageTracker({
    getValkey,
    consumeScript,
    now = Date.now,
}: {
    getValkey: () => Valkey | undefined;
    consumeScript: Script;
    now?: () => number;
}): SeedSuggestionUsageTracker {
    const issuedSuggestionsById = new Map<
        string,
        { ownershipKey: string; expiresAtMs: number }
    >();
    const getOwnershipKey = ({
        userId,
        draftId,
        generationId,
    }: {
        userId: string;
        draftId: string;
        generationId: string;
    }) => JSON.stringify([userId, draftId, generationId]);
    const registerIssuedSuggestions = async ({
        userId,
        draftId,
        response,
    }: {
        userId: string;
        draftId: string;
        response: GenerateSeedSuggestionsResponse;
    }): Promise<void> => {
        if (!response.confident) return;
        const ownershipKey = getOwnershipKey({
            userId,
            draftId,
            generationId: response.generationId,
        });
        const valkey = getValkey();
        if (valkey !== undefined) {
            await Promise.all(
                response.suggestions.map((suggestion) =>
                    valkey.set(
                        `seed-suggestion:issued:${suggestion.suggestionId}`,
                        ownershipKey,
                        {
                            expiry: {
                                type: TimeUnit.Milliseconds,
                                count: ISSUED_SUGGESTION_TTL_MS,
                            },
                        },
                    ),
                ),
            );
            return;
        }
        const currentTime = now();
        for (const [id, entry] of issuedSuggestionsById)
            if (entry.expiresAtMs <= currentTime)
                issuedSuggestionsById.delete(id);
        for (const suggestion of response.suggestions) {
            if (issuedSuggestionsById.size >= MAX_IN_MEMORY_ISSUED_SUGGESTIONS)
                break;
            issuedSuggestionsById.set(suggestion.suggestionId, {
                ownershipKey,
                expiresAtMs: currentTime + ISSUED_SUGGESTION_TTL_MS,
            });
        }
    };
    const consumeIssuedSuggestion = async ({
        userId,
        request,
    }: {
        userId: string;
        request: RecordSeedSuggestionUseRequest;
    }): Promise<boolean> => {
        const ownershipKey = getOwnershipKey({ userId, ...request });
        const valkey = getValkey();
        if (valkey !== undefined) {
            const result = z.union([z.literal(0), z.literal(1)]).parse(
                await valkey.invokeScript(consumeScript, {
                    keys: [`seed-suggestion:issued:${request.suggestionId}`],
                    args: [ownershipKey],
                }),
            );
            return result === 1;
        }
        const entry = issuedSuggestionsById.get(request.suggestionId);
        if (entry?.ownershipKey !== ownershipKey || entry.expiresAtMs <= now())
            return false;
        issuedSuggestionsById.delete(request.suggestionId);
        return true;
    };
    return { registerIssuedSuggestions, consumeIssuedSuggestion };
}
