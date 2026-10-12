import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import type { FastifyBaseLogger } from "fastify";
import { logApiError } from "@/logging/privacy.js";
import { htmlToCountedText } from "@/shared/richText.js";
import {
    validateRichTextHtmlByteCount,
    validateRichTextInputWithPlainText,
} from "@/shared/shared.js";
import {
    SEED_SUGGESTION_TARGET_COUNT,
    type GenerateSeedSuggestionsRequest,
    type GenerateSeedSuggestionsResponse,
} from "@/shared/types/dto.js";
import {
    type BedrockConverse,
    createBedrockSeedSuggestionSource,
    type SeedSuggestionFailureReason,
    type SeedSuggestionModelResult,
    type SeedSuggestionSource,
} from "./seedSuggestionModel.js";
import {
    DEFAULT_SEED_SUGGESTION_SYSTEM_PROMPT,
    selectUsableSeedStatements,
    selectUsableSeedTip,
    type SeedSuggestionModelInput,
} from "./seedSuggestionPrompt.js";
import type { SeedSuggestionSourceName } from "./seedSuggestionSourceName.js";

export type GenerateSeedSuggestionsFailureReason =
    | SeedSuggestionFailureReason
    | "description_too_long";

export type GenerateSeedSuggestionsResult =
    | { success: true; response: GenerateSeedSuggestionsResponse }
    | {
          success: false;
          reason: GenerateSeedSuggestionsFailureReason;
      };

type DescriptionResult =
    | { success: true; plainText: string }
    | { success: false };

/**
 * The description as plain text, refused above the limits that apply when the
 * conversation is published: without them, a request sent outside the page could make
 * the model read a very long text, at Agora's expense.
 */
function readDescription(html: string | undefined): DescriptionResult {
    if (html === undefined) {
        return { success: true, plainText: "" };
    }
    const htmlSize = validateRichTextHtmlByteCount({
        htmlString: html,
        mode: "conversation",
    });
    if (!htmlSize.success) {
        return { success: false };
    }
    const plainText = htmlToCountedText(html);
    if (plainText.trim() === "") return { success: true, plainText: "" };
    const textSize = validateRichTextInputWithPlainText({
        htmlString: html,
        plainText,
        mode: "conversation",
    });
    if (!textSize.success) {
        return { success: false };
    }
    return { success: true, plainText };
}

// Keywords a reviewer puts in the conversation title to see each state of the page
// without calling a model. Only the simulated source reads them.
const SIMULATE_NOT_CONFIDENT = "simulate:not-confident";
const SIMULATE_FAILURE = "simulate:failure";
const SIMULATE_SLOW = "simulate:slow";
const SIMULATED_SLOW_DELAY_MS = 5000;

interface CreateSimulatedSeedSuggestionSourceParams {
    slowDelayMs?: number;
}

export function createSimulatedSeedSuggestionSource({
    slowDelayMs = SIMULATED_SLOW_DELAY_MS,
}: CreateSimulatedSeedSuggestionSourceParams = {}): SeedSuggestionSource {
    const generate = async ({
        conversationTitle,
        existingStatements,
        targetCount,
        signal,
    }: SeedSuggestionModelInput): Promise<SeedSuggestionModelResult> => {
        if (signal?.aborted) return { success: false, reason: "cancelled" };
        const title = conversationTitle.toLowerCase();
        if (title.includes(SIMULATE_FAILURE)) {
            return {
                success: false,
                reason: "model_failure",
            };
        }
        if (title.includes(SIMULATE_NOT_CONFIDENT)) {
            return {
                success: true,
                answer: {
                    confidence: false,
                    userFeedback:
                        "Simulated tip: say who this question is for and what you would like participants to propose.",
                    statements: [],
                },
            };
        }
        if (title.includes(SIMULATE_SLOW)) {
            try {
                await sleep(slowDelayMs, undefined, { signal });
            } catch (error) {
                if (signal?.aborted)
                    return { success: false, reason: "cancelled" };
                throw error;
            }
        }
        // Numbered after what is already on the page, so pressing the button again
        // returns statements that differ from the previous ones.
        const firstNumber = existingStatements.length + 1;
        return {
            success: true,
            answer: {
                confidence: true,
                userFeedback: "",
                statements: Array.from(
                    { length: targetCount },
                    (_, index) =>
                        `Simulated suggestion ${String(firstNumber + index)}: a placeholder statement to agree or disagree with.`,
                ),
            },
        };
    };

    return { name: "simulated", generate };
}

export type SeedSuggestionSettings =
    | { source: "simulated" }
    | {
          source: "bedrock";
          systemPrompt: string | undefined;
          temperature: number;
          timeoutMs: number;
          modelId: string;
          converse: BedrockConverse;
          logError: (error: unknown) => void;
      };

export function createSeedSuggestionSource(
    settings: SeedSuggestionSettings,
): SeedSuggestionSource {
    switch (settings.source) {
        case "simulated":
            return createSimulatedSeedSuggestionSource();
        case "bedrock":
            return createBedrockSeedSuggestionSource({
                modelId: settings.modelId,
                systemPrompt:
                    settings.systemPrompt ??
                    DEFAULT_SEED_SUGGESTION_SYSTEM_PROMPT,
                temperature: settings.temperature,
                timeoutMs: settings.timeoutMs,
                converse: settings.converse,
                logError: settings.logError,
            });
    }
}

interface GenerateSeedSuggestionsParams {
    source: SeedSuggestionSource;
    request: GenerateSeedSuggestionsRequest;
    signal?: AbortSignal;
}

export async function generateSeedSuggestions({
    source,
    request,
    signal,
}: GenerateSeedSuggestionsParams): Promise<GenerateSeedSuggestionsResult> {
    const description = readDescription(request.conversationBody);
    if (!description.success) {
        return {
            success: false,
            reason: "description_too_long",
        };
    }
    const result = await source.generate({
        conversationType: request.conversationType,
        conversationTitle: request.conversationTitle,
        // The description is rich text; the model reads plain text.
        conversationBody: description.plainText,
        existingStatements: request.existingStatements,
        targetCount: SEED_SUGGESTION_TARGET_COUNT,
        signal,
    });
    if (!result.success) {
        return result;
    }

    const generationId = randomUUID();
    const { answer } = result;
    if (!answer.confidence) {
        const tip = selectUsableSeedTip(answer.userFeedback);
        if (tip === undefined) {
            return {
                success: false,
                reason: "invalid_answer",
            };
        }
        // The statements of a not-confident answer are never sent to the browser.
        return {
            success: true,
            response: { generationId, confident: false, tip },
        };
    }

    const statements = selectUsableSeedStatements({
        statements: answer.statements,
        existingStatements: request.existingStatements,
        targetCount: SEED_SUGGESTION_TARGET_COUNT,
    });
    if (statements.length === 0) {
        return {
            success: false,
            reason: "invalid_answer",
        };
    }
    return {
        success: true,
        response: {
            generationId,
            confident: true,
            suggestions: statements.map((text) => ({
                suggestionId: randomUUID(),
                text,
            })),
        },
    };
}

/**
 * Usage of AI suggestions is recorded as marked lines in the API log, not in the
 * database: how often they are requested, and how many are taken as statements.
 * No conversation or suggestion text is logged.
 */
export const SEED_SUGGESTION_EVENT_MARKER = "AGORA_AI_SUGGESTION_EVENT";

interface SeedSuggestionRequestEvent {
    userId: string;
    draftId: string;
    conversationType: GenerateSeedSuggestionsRequest["conversationType"];
    source: SeedSuggestionSourceName;
    durationMs: number;
}

export type SeedSuggestionEvent =
    | (SeedSuggestionRequestEvent & {
          event: "generated";
          generationId: string;
          confident: boolean;
          suggestionIds: string[];
      })
    | (SeedSuggestionRequestEvent & {
          event: "failed";
          reason: GenerateSeedSuggestionsFailureReason;
      })
    | {
          event: "added";
          userId: string;
          draftId: string;
          generationId: string;
          suggestionId: string;
      };

export function logSeedSuggestionEvent({
    logger,
    event,
}: {
    logger: Pick<FastifyBaseLogger, "info" | "warn" | "error">;
    event: SeedSuggestionEvent;
}): void {
    if (event.event === "failed") {
        logApiError({
            logger,
            level: "warn",
            event: { event: "seed_suggestion_failed", seedSuggestion: event },
            error: undefined,
        });
    } else {
        logger.info(
            { event: "seed_suggestion", seedSuggestion: event },
            SEED_SUGGESTION_EVENT_MARKER,
        );
    }
}
