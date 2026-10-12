import { describe, expect, it, vi } from "vitest";

import {
    createBedrockSeedSuggestionSource,
    type BedrockConverse,
    type BedrockConverseParams,
} from "./seedSuggestionModel.js";
import type { SeedSuggestionModelInput } from "./seedSuggestionPrompt.js";

const input: SeedSuggestionModelInput = {
    conversationType: "polis",
    conversationTitle: "Night buses",
    conversationBody: "Which priorities?",
    existingStatements: [],
    targetCount: 3,
};
const answerText = JSON.stringify({
    confidence: true,
    user_feedback: "A tip.",
    statements: ["One.", "Two.", "Three."],
});

describe("Bedrock seed suggestion source", () => {
    it("does not retry when its caller cancels a request", async () => {
        const controller = new AbortController();
        let calls = 0;
        const source = bedrockSource((params) => {
            calls += 1;
            return hangUntilAborted(params);
        });
        const generating = source.generate({
            ...input,
            signal: controller.signal,
        });
        controller.abort();
        expect(await generating).toMatchObject({
            success: false,
            reason: "cancelled",
        });
        expect(calls).toBe(1);
    });
    function bedrockSource(converse: BedrockConverse) {
        return createBedrockSeedSuggestionSource({
            modelId: "mistral.mistral-large-3-675b-instruct",
            systemPrompt: "System for {{target_count}} statements.",
            temperature: 0.3,
            timeoutMs: 1000,
            converse,
            logError: vi.fn(),
        });
    }

    it("sends the prompt with the configured model and temperature, and reads the answer", async () => {
        const calls: BedrockConverseParams[] = [];
        const source = bedrockSource((params) => {
            calls.push(params);
            return Promise.resolve("```json\n" + answerText + "\n```");
        });

        const result = await source.generate(input);

        expect(result).toMatchObject({
            success: true,
            answer: {
                confidence: true,
                statements: ["One.", "Two.", "Three."],
            },
        });
        expect(calls).toHaveLength(1);
        expect(calls[0]).toMatchObject({
            modelId: "mistral.mistral-large-3-675b-instruct",
            temperature: 0.3,
            messages: { system: "System for 3 statements." },
        });
        expect(calls[0]?.messages.user).toContain("Night buses");
    });

    it("reports a failed call as a model failure", async () => {
        const source = bedrockSource(() =>
            Promise.reject(new Error("AccessDeniedException")),
        );

        expect(await source.generate(input)).toMatchObject({
            success: false,
            reason: "model_failure",
        });
    });

    it("reports an unreadable answer as invalid", async () => {
        for (const text of ["not json", '{"confidence": "yes"}']) {
            const source = bedrockSource(() => Promise.resolve(text));

            expect(await source.generate(input)).toMatchObject({
                success: false,
                reason: "invalid_answer",
            });
        }
    });

    function hangUntilAborted({ signal }: BedrockConverseParams) {
        return new Promise<string>((_resolve, reject) => {
            signal.addEventListener("abort", () => {
                const aborted = new Error("Request aborted");
                aborted.name = "AbortError";
                reject(aborted);
            });
        });
    }

    it("tries once more when a call gets no answer in time", async () => {
        let callCount = 0;
        const source = createBedrockSeedSuggestionSource({
            modelId: "mistral.mistral-large-3-675b-instruct",
            systemPrompt: "System",
            temperature: 0.3,
            timeoutMs: 1000,
            attemptTimeoutMs: 20,
            converse: (params) => {
                callCount += 1;
                return callCount === 1
                    ? hangUntilAborted(params)
                    : Promise.resolve(answerText);
            },
            logError: vi.fn(),
        });

        expect(await source.generate(input)).toMatchObject({ success: true });
        expect(callCount).toBe(2);
    });

    it("gives up after two calls without an answer", async () => {
        let callCount = 0;
        const source = createBedrockSeedSuggestionSource({
            modelId: "mistral.mistral-large-3-675b-instruct",
            systemPrompt: "System",
            temperature: 0.3,
            timeoutMs: 1000,
            attemptTimeoutMs: 20,
            converse: (params) => {
                callCount += 1;
                return hangUntilAborted(params);
            },
            logError: vi.fn(),
        });

        expect(await source.generate(input)).toMatchObject({
            success: false,
            reason: "timeout",
        });
        expect(callCount).toBe(2);
    });

    it("does not retry a failure other than a timeout", async () => {
        let callCount = 0;
        const source = bedrockSource(() => {
            callCount += 1;
            return Promise.reject(new Error("AccessDeniedException"));
        });

        expect(await source.generate(input)).toMatchObject({
            success: false,
            reason: "model_failure",
        });
        expect(callCount).toBe(1);
    });

    it("reports a timeout when the model takes too long", async () => {
        const source = createBedrockSeedSuggestionSource({
            modelId: "mistral.mistral-large-3-675b-instruct",
            systemPrompt: "System",
            temperature: 0.3,
            timeoutMs: 20,
            converse: ({ signal }) =>
                new Promise<string>((_resolve, reject) => {
                    signal.addEventListener("abort", () => {
                        const timeout = new Error("timed out");
                        timeout.name = "TimeoutError";
                        reject(timeout);
                    });
                }),
            logError: vi.fn(),
        });

        expect(await source.generate(input)).toMatchObject({
            success: false,
            reason: "timeout",
        });
    });
});
