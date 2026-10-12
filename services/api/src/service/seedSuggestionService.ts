import type { BaseLogger } from "pino";
import { logApiError } from "@/logging/privacy.js";
import { checkFeatureAccess } from "@/shared-app-api/featureAccess.js";
import type {
    GenerateSeedSuggestionsRequest,
    GenerateSeedSuggestionsResponse,
    RecordSeedSuggestionUseRequest,
} from "@/shared/types/dto.js";
import {
    generateSeedSuggestions,
    logSeedSuggestionEvent,
    type GenerateSeedSuggestionsFailureReason,
} from "./seedSuggestion.js";
import type { SeedSuggestionSource } from "./seedSuggestionModel.js";
import type {
    SeedSuggestionRateLimitResult,
    SeedSuggestionRateLimitOperation,
} from "./seedSuggestionRateLimit.js";
import type { SeedSuggestionUsageTracker } from "./seedSuggestionUsage.js";

export type SeedSuggestionServiceFailure =
    | {
          success: false;
          reason:
              | GenerateSeedSuggestionsFailureReason
              | "disabled"
              | "not_available"
              | "organization_not_available"
              | "security_challenge_failed";
      }
    | { success: false; reason: "rate_limited"; retryAfterMs: number };

export type GenerateSeedSuggestionsServiceResult =
    | { success: true; response: GenerateSeedSuggestionsResponse }
    | SeedSuggestionServiceFailure;

export function createSeedSuggestionService({
    source,
    access,
    isOrganizationMember,
    consumeRateLimit,
    verifyChallenge,
    usageTracker,
    logger,
}: {
    source: SeedSuggestionSource | undefined;
    access: { orgOnly: boolean; allowedOrgs: string; allowedUsers: string };
    isOrganizationMember: (params: {
        userId: string;
        organizationSlug: string;
    }) => Promise<boolean>;
    consumeRateLimit: (params: {
        userId: string;
        operation: SeedSuggestionRateLimitOperation;
    }) => Promise<SeedSuggestionRateLimitResult>;
    verifyChallenge:
        | ((token: string | undefined) => Promise<boolean>)
        | undefined;
    usageTracker: SeedSuggestionUsageTracker;
    logger: Pick<BaseLogger, "info" | "warn" | "error">;
}) {
    const generate = async ({
        userId,
        request,
        turnstileToken,
        signal,
    }: {
        userId: string;
        request: GenerateSeedSuggestionsRequest;
        turnstileToken: string | undefined;
        signal: AbortSignal;
    }): Promise<GenerateSeedSuggestionsServiceResult> => {
        if (source === undefined) return { success: false, reason: "disabled" };
        const accessCheck = checkFeatureAccess({
            featureEnabled: true,
            isOrgOnly: access.orgOnly,
            allowedOrgs: access.allowedOrgs,
            allowedUsers: access.allowedUsers,
            postAsOrganization: request.postAsOrganization !== undefined,
            organizationName: request.postAsOrganization ?? "",
            userId,
        });
        if (!accessCheck.allowed)
            return { success: false, reason: "not_available" };
        if (
            request.postAsOrganization !== undefined &&
            !(await isOrganizationMember({
                userId,
                organizationSlug: request.postAsOrganization,
            }))
        ) {
            return { success: false, reason: "organization_not_available" };
        }
        const rateLimit = await consumeRateLimit({
            userId,
            operation: "generate",
        });
        if (!rateLimit.isAllowed)
            return {
                success: false,
                reason: "rate_limited",
                retryAfterMs: rateLimit.retryAfterMs,
            };
        if (
            verifyChallenge !== undefined &&
            !(await verifyChallenge(turnstileToken))
        ) {
            return { success: false, reason: "security_challenge_failed" };
        }

        const startedAt = performance.now();
        const result = await generateSeedSuggestions({
            source,
            request,
            signal,
        });
        const requestEvent = {
            userId,
            draftId: request.draftId,
            conversationType: request.conversationType,
            source: source.name,
            durationMs: performance.now() - startedAt,
        };
        if (!result.success) {
            logSeedSuggestionEvent({
                logger,
                event: {
                    event: "failed",
                    ...requestEvent,
                    reason: result.reason,
                },
            });
            return result;
        }
        try {
            await usageTracker.registerIssuedSuggestions({
                userId,
                draftId: request.draftId,
                response: result.response,
            });
        } catch (error) {
            logApiError({
                logger,
                level: "warn",
                event: { event: "application_error" },
                error,
            });
        }
        logSeedSuggestionEvent({
            logger,
            event: {
                event: "generated",
                ...requestEvent,
                generationId: result.response.generationId,
                confident: result.response.confident,
                suggestionIds: result.response.confident
                    ? result.response.suggestions.map(
                          (suggestion) => suggestion.suggestionId,
                      )
                    : [],
            },
        });
        return result;
    };

    const recordAcceptance = async ({
        userId,
        request,
    }: {
        userId: string;
        request: RecordSeedSuggestionUseRequest;
    }): Promise<{ success: true } | SeedSuggestionServiceFailure> => {
        if (source === undefined) return { success: false, reason: "disabled" };
        const rateLimit = await consumeRateLimit({
            userId,
            operation: "record_acceptance",
        });
        if (!rateLimit.isAllowed)
            return {
                success: false,
                reason: "rate_limited",
                retryAfterMs: rateLimit.retryAfterMs,
            };
        if (await usageTracker.consumeIssuedSuggestion({ userId, request })) {
            logSeedSuggestionEvent({
                logger,
                event: { event: "added", userId, ...request },
            });
        }
        return { success: true };
    };
    return { generate, recordAcceptance };
}
