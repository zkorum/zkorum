import type { Script } from "@valkey/valkey-glide";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Valkey } from "@/shared-backend/valkey.js";

export type SeedSuggestionRateLimitOperation = "generate" | "record_acceptance";
export const SEED_SUGGESTION_RATE_LIMIT_WINDOW_MS = 60_000;
export const SEED_SUGGESTION_RATE_LIMITS = {
    generate: 5,
    record_acceptance: 30,
} satisfies Record<SeedSuggestionRateLimitOperation, number>;
const MAX_TRACKED_USERS = 10_000;
export type SeedSuggestionRateLimitResult =
    | { isAllowed: true }
    | { isAllowed: false; retryAfterMs: number };

// One atomic sliding window shared by all API instances. Valkey owns the clock
// and expires idle users so neither client clocks nor process restarts reset it.
export const SEED_SUGGESTION_RATE_LIMIT_SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local window = tonumber(ARGV[1])
local max = tonumber(ARGV[2])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)
if redis.call('ZCARD', KEYS[1]) >= max then
    local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
    return {0, tonumber(oldest[2]) + window - now}
end
redis.call('ZADD', KEYS[1], now, ARGV[3])
redis.call('PEXPIRE', KEYS[1], window)
return {1, 0}
`;
const resultSchema = z.tuple([
    z.union([z.literal(0), z.literal(1)]),
    z.number().int().nonnegative(),
]);

export async function consumeSeedSuggestionRateLimit({
    valkey,
    script,
    userId,
    operation,
}: {
    valkey: Valkey;
    script: Script;
    userId: string;
    operation: SeedSuggestionRateLimitOperation;
}): Promise<SeedSuggestionRateLimitResult> {
    const [allowed, retryAfterMs] = resultSchema.parse(
        await valkey.invokeScript(script, {
            keys: [`seed-suggestion:rate-limit:${operation}:${userId}`],
            args: [
                String(SEED_SUGGESTION_RATE_LIMIT_WINDOW_MS),
                String(SEED_SUGGESTION_RATE_LIMITS[operation]),
                randomUUID(),
            ],
        }),
    );
    return allowed === 1
        ? { isAllowed: true }
        : { isAllowed: false, retryAfterMs };
}

export function createInMemorySeedSuggestionRateLimiter({
    maxRequests = SEED_SUGGESTION_RATE_LIMITS.generate,
    windowMs = SEED_SUGGESTION_RATE_LIMIT_WINDOW_MS,
    now = Date.now,
}: { maxRequests?: number; windowMs?: number; now?: () => number } = {}) {
    const requestTimesByUser = new Map<string, number[]>();
    let lastCleanupAtMs = now();
    const consume = (userId: string): SeedSuggestionRateLimitResult => {
        const currentTime = now();
        const windowStart = currentTime - windowMs;
        if (currentTime - lastCleanupAtMs >= windowMs) {
            for (const [trackedUserId, times] of requestTimesByUser) {
                if (times.every((time) => time <= windowStart))
                    requestTimesByUser.delete(trackedUserId);
            }
            lastCleanupAtMs = currentTime;
        }
        const recentTimes = (requestTimesByUser.get(userId) ?? []).filter(
            (time) => time > windowStart,
        );
        const oldestTime = recentTimes.at(0);
        if (recentTimes.length >= maxRequests && oldestTime !== undefined) {
            return {
                isAllowed: false,
                retryAfterMs: oldestTime + windowMs - currentTime,
            };
        }
        if (
            !requestTimesByUser.has(userId) &&
            requestTimesByUser.size >= MAX_TRACKED_USERS
        ) {
            return { isAllowed: false, retryAfterMs: windowMs };
        }
        requestTimesByUser.set(userId, [...recentTimes, currentTime]);
        return { isAllowed: true };
    };
    return { consume };
}
