import {
    type BedrockRuntimeClient,
    ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
    buildSeedSuggestionMessages,
    parseSeedSuggestionAnswer,
    type SeedSuggestionMessages,
    type SeedSuggestionModelAnswer,
    type SeedSuggestionModelInput,
} from "./seedSuggestionPrompt.js";
import type { SeedSuggestionSourceName } from "./seedSuggestionSourceName.js";

export type SeedSuggestionFailureReason =
    | "model_failure"
    | "invalid_answer"
    | "cancelled"
    | "timeout";

export type SeedSuggestionModelResult =
    | { success: true; answer: SeedSuggestionModelAnswer }
    | {
          success: false;
          reason: SeedSuggestionFailureReason;
      };

export interface SeedSuggestionSource {
    name: SeedSuggestionSourceName;
    generate: (
        input: SeedSuggestionModelInput,
    ) => Promise<SeedSuggestionModelResult>;
}

const MAX_OUTPUT_TOKENS = 1024;
const BEDROCK_ATTEMPT_TIMEOUT_MS = 12_000;

function isTimeoutError(error: unknown): boolean {
    return (
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
    );
}

function toModelResult(rawText: string): SeedSuggestionModelResult {
    const answer = parseSeedSuggestionAnswer(rawText);
    if (answer === undefined) {
        return {
            success: false,
            reason: "invalid_answer",
        };
    }
    return { success: true, answer };
}

export interface BedrockConverseParams {
    modelId: string;
    messages: SeedSuggestionMessages;
    temperature: number;
    signal: AbortSignal;
}

export type BedrockConverse = (
    params: BedrockConverseParams,
) => Promise<string>;

export function createBedrockConverse(
    client: BedrockRuntimeClient,
): BedrockConverse {
    return async ({ modelId, messages, temperature, signal }) => {
        const output = await client.send(
            new ConverseCommand({
                modelId,
                system: [{ text: messages.system }],
                messages: [
                    { role: "user", content: [{ text: messages.user }] },
                ],
                inferenceConfig: { temperature, maxTokens: MAX_OUTPUT_TOKENS },
            }),
            { abortSignal: signal },
        );
        const text = (output.output?.message?.content ?? [])
            .map((block) => block.text ?? "")
            .join("");
        if (text === "") {
            throw new Error("Bedrock returned no text");
        }
        return text;
    };
}

export interface BedrockSeedSuggestionSourceParams {
    modelId: string;
    systemPrompt: string;
    temperature: number;
    /** Overall limit for a generation, retry included. */
    timeoutMs: number;
    /** Limit for one Bedrock call before it is tried once more. */
    attemptTimeoutMs?: number;
    converse: BedrockConverse;
    logError: (error: unknown) => void;
}

export function createBedrockSeedSuggestionSource({
    modelId,
    systemPrompt,
    temperature,
    timeoutMs,
    attemptTimeoutMs = BEDROCK_ATTEMPT_TIMEOUT_MS,
    converse,
    logError,
}: BedrockSeedSuggestionSourceParams): SeedSuggestionSource {
    const generate = async (
        input: SeedSuggestionModelInput,
    ): Promise<SeedSuggestionModelResult> => {
        const signal =
            input.signal === undefined
                ? AbortSignal.timeout(timeoutMs)
                : AbortSignal.any([
                      input.signal,
                      AbortSignal.timeout(timeoutMs),
                  ]);
        const messages = buildSeedSuggestionMessages({ systemPrompt, input });
        const firstAttemptDeadline = AbortSignal.timeout(attemptTimeoutMs);
        const attempt = (deadline: AbortSignal): Promise<string> =>
            converse({
                modelId,
                messages,
                temperature,
                signal: AbortSignal.any([signal, deadline]),
            });
        try {
            signal.throwIfAborted();
            let text: string;
            try {
                text = await attempt(firstAttemptDeadline);
            } catch (error) {
                if (signal.aborted || !firstAttemptDeadline.aborted)
                    throw error;
                text = await attempt(AbortSignal.timeout(attemptTimeoutMs));
            }
            return toModelResult(text);
        } catch (error: unknown) {
            if (!input.signal?.aborted) logError(error);
            return {
                success: false,
                reason: input.signal?.aborted
                    ? "cancelled"
                    : signal.aborted || isTimeoutError(error)
                      ? "timeout"
                      : "model_failure",
            };
        }
    };
    return { name: "bedrock", generate };
}
