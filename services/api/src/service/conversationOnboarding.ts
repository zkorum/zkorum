import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    Dto,
    type ConversationOnboardingPreferenceSaveRequest,
    type ConversationOnboardingPreferenceSaveResponse,
    type ConversationOnboardingTicketVerifyRequest,
    type ConversationOnboardingTicketVerifyResponse,
} from "@/shared/types/dto.js";
import type { DeviceLoginStatusExtended } from "@/shared/types/zod.js";
import { createConversationEmailUpdateService } from "./conversationEmailUpdate.js";
import { getConversationParticipationStatus } from "./participationGate.js";
import type { verifyEventTicket } from "./zupass.js";

export async function saveConversationOnboardingPreference({
    db,
    deviceStatus,
    request,
    emailUpdateOptions,
}: {
    db: PostgresJsDatabase;
    deviceStatus: Extract<DeviceLoginStatusExtended, { isKnown: true }>;
    request: ConversationOnboardingPreferenceSaveRequest;
    emailUpdateOptions: Omit<
        Parameters<typeof createConversationEmailUpdateService>[0],
        "db"
    >;
}): Promise<ConversationOnboardingPreferenceSaveResponse> {
    return await db.transaction(async (tx) => {
        const emailUpdates = createConversationEmailUpdateService({
            ...emailUpdateOptions,
            db: tx,
        });
        const preferenceRequest =
            Dto.conversationEmailUpdatePreferenceUpdateRequest.parse(
                request.operation === "set_project_preference"
                    ? {
                          operation: request.operation,
                          projectSlug: request.projectSlug,
                          enabled: request.enabled,
                          source: {
                              kind: "onboarding",
                              conversationSlugId: request.conversationSlugId,
                          },
                      }
                    : {
                          operation: request.operation,
                          conversationSlugId: request.conversationSlugId,
                          enabled: request.enabled,
                          source: "onboarding",
                      },
            );
        const response = await emailUpdates.updatePreference({
            userId: deviceStatus.userId,
            request: preferenceRequest,
        });
        if (!response.success) return response;
        const participationStatus = await getConversationParticipationStatus({
            db: tx,
            deviceStatus,
            conversationSlugId: request.conversationSlugId,
            skipEmailUpdateConsent: false,
            getEmailUpdateOnboardingAction: (params) =>
                emailUpdates.getParticipationOnboardingAction({
                    database: tx,
                    ...params,
                }),
        });
        return { ...response, participationStatus };
    });
}

export async function verifyConversationOnboardingTicket({
    db,
    request,
    verification,
    emailUpdateOptions,
}: {
    db: PostgresJsDatabase;
    request: ConversationOnboardingTicketVerifyRequest;
    verification: Omit<
        Parameters<typeof verifyEventTicket>[0],
        "db" | "proofData" | "eventSlug" | "afterVerified"
    >;
    emailUpdateOptions: Omit<
        Parameters<typeof createConversationEmailUpdateService>[0],
        "db"
    >;
}): Promise<ConversationOnboardingTicketVerifyResponse> {
    const { verifyEventTicket } = await import("./zupass.js");
    const result = await verifyEventTicket({
        ...verification,
        db,
        proofData: request.proof,
        eventSlug: request.eventSlug,
        afterVerified: async ({ database, userId }) => {
            const { getDeviceStatus } = await import("./authUtil.js");
            const deviceStatus = await getDeviceStatus({
                db: database,
                didWrite: verification.didWrite,
                now: verification.now,
            });
            if (!deviceStatus.isKnown || deviceStatus.userId !== userId)
                throw new Error("Verified ticket session is unavailable");
            const emailUpdates = createConversationEmailUpdateService({
                ...emailUpdateOptions,
                db: database,
            });
            return await getConversationParticipationStatus({
                db: database,
                deviceStatus,
                conversationSlugId: request.conversationSlugId,
                skipEmailUpdateConsent: request.skipEmailUpdateConsent,
                getEmailUpdateOnboardingAction: (params) =>
                    emailUpdates.getParticipationOnboardingAction({
                        database,
                        ...params,
                    }),
            });
        },
    });
    if (!result.success) return result;
    return {
        success: true,
        userId: result.userId,
        accountMerged: result.accountMerged,
        participationStatus: result.continuation,
    };
}
