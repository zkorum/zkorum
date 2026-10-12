import { describe, expect, it } from "vitest";
import { configSchema } from "../src/app.js";

const production = {
    NODE_ENV: "production",
    PHONE_AUTH_MODE: "disabled",
    CORS_ORIGIN_LIST: "https://www.agoracitizen.app",
    PEPPERS: "synthetic-test-pepper",
    VERIFICATOR_SVC_BASE_URL: "https://verificator.example.invalid",
};

describe("AI suggestions production configuration", () => {
    it("rejects simulated generation even when the feature is disabled", () => {
        expect(
            configSchema.safeParse({
                ...production,
                AI_SUGGESTIONS_SOURCE: "simulated",
            }).success,
        ).toBe(false);
    });
    it("requires Turnstile and shared rate-limit storage when enabled", () => {
        const result = configSchema.safeParse({
            ...production,
            AI_SUGGESTIONS_ENABLED: "true",
        });
        expect(result.success).toBe(false);
        if (!result.success)
            expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
                expect.arrayContaining([
                    "TURNSTILE_ENABLED",
                    "QUEUE_VALKEY_URL",
                ]),
            );
    });
    it("accepts production Bedrock with real challenge settings and Valkey", () => {
        const result = configSchema.safeParse({
            ...production,
            AI_SUGGESTIONS_ENABLED: "true",
            TURNSTILE_ENABLED: "true",
            TURNSTILE_SECRET_KEY: "production-secret",
            TURNSTILE_ALLOWED_HOSTNAMES: "www.agoracitizen.app",
            QUEUE_VALKEY_URL: "valkey://localhost:6379",
        });
        expect(result.success).toBe(true);
    });
    it("rejects empty model settings and old phone-only variable names", () => {
        for (const invalid of [
            { AI_SUGGESTIONS_BEDROCK_REGION: " " },
            { AI_SUGGESTIONS_BEDROCK_MODEL_ID: "" },
            { PHONE_TURNSTILE_ENABLED: "true" },
        ]) {
            expect(
                configSchema.safeParse({ ...production, ...invalid }).success,
            ).toBe(false);
        }
    });
});
