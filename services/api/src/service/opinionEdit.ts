import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { z } from "zod";
import type { Script } from "@valkey/valkey-glide";
import type { Valkey } from "@/shared-backend/valkey.js";
import type {
    SupportedDisplayLanguageCodes,
    SupportedSpokenLanguageCodes,
} from "@/shared/languages.js";
import { Dto } from "@/shared/types/dto.js";
import { getPrimaryDatabase } from "@/shared-backend/db.js";
import {
    conversationTable,
    conversationModerationTable,
    opinionTable,
    opinionContentTable,
    opinionModerationTable,
    userTable,
} from "@/shared-backend/schema.js";
import type { GoogleCloudCredentials } from "@/shared-backend/googleCloudAuth.js";
import { scheduleConversationAnalysisRefresh } from "@/shared-backend/conversationCounters.js";
import { log } from "@/app.js";
import type { VoteBuffer } from "./voteBuffer.js";
import { getOpinionManagementCapabilities } from "./opinionPermissions.js";
import { normalizeUserRichTextInput } from "./richText.js";
import {
    contentLanguageMetadataUpdateValues,
    resolveContentLanguageMetadata,
} from "./contentLanguageMetadata.js";
import { getConversationMultilingualSetting } from "./conversationMultilingual.js";
import { fetchOpinionsByOpinionSlugIdList } from "./comment.js";
import { createConversationViewSnapshotsFromCurrentState } from "./conversationViewSnapshot.js";
import { queueOpinionUpdatedEvent } from "./realtimeEventOutbox.js";
import {
    createEagerContentTranslationWorkForConversation,
    enqueueEagerContentTranslationWork,
} from "./contentTranslation.js";

export async function editOpinion({
    db,
    request,
    userId,
    voteBuffer,
    googleCloudCredentials,
    valkey,
    translationQueueScript,
    displayLanguage,
    spokenLanguages,
}: {
    db: PostgresJsDatabase;
    request: z.infer<typeof Dto.editOpinionRequest>;
    userId: string;
    voteBuffer: VoteBuffer;
    googleCloudCredentials: GoogleCloudCredentials | undefined;
    valkey: Valkey | undefined;
    translationQueueScript: Script;
    displayLanguage: SupportedDisplayLanguageCodes;
    spokenLanguages: SupportedSpokenLanguageCodes[];
}): Promise<z.infer<typeof Dto.editOpinionResponse>> {
    const normalized = normalizeUserRichTextInput({
        html: request.opinionBody,
        validationMode: "opinion",
    });
    if (!normalized.success)
        return { success: false, reason: normalized.reason };
    let translationWorkIds: number[] = [];
    const blockedDuringSave = new Error(
        "Statement received votes while saving",
    );
    let response: z.infer<typeof Dto.editOpinionResponse>;
    try {
        response = await getPrimaryDatabase(db).transaction(
            async (tx): Promise<z.infer<typeof Dto.editOpinionResponse>> => {
                // Lock the stable row before joining content: a concurrent pointer
                // update can otherwise make PostgreSQL discard the joined result.
                const lockedRows = await tx
                    .select({
                        id: opinionTable.id,
                        slugId: opinionTable.slugId,
                        authorId: opinionTable.authorId,
                        isSeed: opinionTable.isSeed,
                        createdAt: opinionTable.createdAt,
                        updatedAt: opinionTable.updatedAt,
                        conversationId: opinionTable.conversationId,
                        currentContentId: opinionTable.currentContentId,
                    })
                    .from(opinionTable)
                    .where(eq(opinionTable.slugId, request.opinionSlugId))
                    .for("update")
                    .limit(1);
                const locked = lockedRows.at(0);
                if (locked === undefined)
                    return { success: false, reason: "not_found" };
                if (locked.currentContentId === null)
                    return { success: false, reason: "not_found" };
                const sourceRows = await tx
                    .select({
                        conversationSlugId: conversationTable.slugId,
                        conversationContentId:
                            conversationTable.currentContentId,
                        contentId: opinionContentTable.id,
                        sourceVersion: opinionContentTable.publicId,
                        content: opinionContentTable.content,
                        isEdited: opinionContentTable.isEdited,
                        sourceLanguageCode:
                            opinionContentTable.sourceLanguageCode,
                        username: userTable.username,
                    })
                    .from(opinionContentTable)
                    .innerJoin(
                        conversationTable,
                        eq(conversationTable.id, locked.conversationId),
                    )
                    .innerJoin(userTable, eq(userTable.id, locked.authorId))
                    .where(
                        and(
                            eq(opinionContentTable.id, locked.currentContentId),
                            eq(opinionContentTable.opinionId, locked.id),
                            isNotNull(conversationTable.currentContentId),
                        ),
                    )
                    .limit(1)
                    .for("no key update", { of: conversationTable });
                const source = sourceRows.at(0);
                if (source === undefined)
                    return { success: false, reason: "not_found" };
                if (source.conversationContentId === null)
                    return { success: false, reason: "not_found" };
                const opinion = {
                    ...locked,
                    ...source,
                    conversationContentId: source.conversationContentId,
                };
                const capabilities = await getOpinionManagementCapabilities({
                    db: tx,
                    opinionSlugIds: [opinion.slugId],
                    userId,
                    lockAuthorization: true,
                });
                const management = capabilities.get(opinion.slugId);
                if (management?.canDelete !== true)
                    return { success: false, reason: "not_allowed" };
                if (opinion.sourceVersion !== request.sourceVersion)
                    return { success: false, reason: "version_conflict" };
                const lockRows = await tx
                    .select({ id: conversationModerationTable.id })
                    .from(conversationModerationTable)
                    .where(
                        and(
                            eq(
                                conversationModerationTable.conversationId,
                                opinion.conversationId,
                            ),
                            isNull(conversationModerationTable.deletedAt),
                        ),
                    )
                    .limit(1);
                const lock = lockRows.at(0);
                if (lock !== undefined)
                    return { success: false, reason: "conversation_locked" };
                if (
                    !management.canEdit ||
                    (await voteBuffer.hasBlockingVotes({
                        opinionId: opinion.id,
                        authorId: opinion.authorId,
                        isSeed: opinion.isSeed,
                    }))
                )
                    return { success: false, reason: "has_votes" };
                const moderationRows = await tx
                    .select()
                    .from(opinionModerationTable)
                    .where(
                        and(
                            eq(opinionModerationTable.opinionId, opinion.id),
                            isNull(opinionModerationTable.deletedAt),
                        ),
                    )
                    .limit(1);
                const moderation = moderationRows.at(0);
                if (moderation?.moderationAction === "hide")
                    return { success: false, reason: "not_allowed" };
                let wasEdited = false;
                if (normalized.content.html !== opinion.content) {
                    const multilingual =
                        await getConversationMultilingualSetting({
                            db: tx,
                            conversationId: opinion.conversationId,
                        });
                    const language = await resolveContentLanguageMetadata({
                        text: normalized.content.plainText,
                        googleCloudCredentials,
                        useGoogleLanguageDetection:
                            multilingual.dynamicTranslationEnabled,
                    });
                    const finalCapabilities =
                        await getOpinionManagementCapabilities({
                            db: tx,
                            opinionSlugIds: [opinion.slugId],
                            userId,
                        });
                    if (
                        finalCapabilities.get(opinion.slugId)?.canEdit !==
                            true ||
                        (await voteBuffer.hasBlockingVotes({
                            opinionId: opinion.id,
                            authorId: opinion.authorId,
                            isSeed: opinion.isSeed,
                        }))
                    )
                        return { success: false, reason: "has_votes" };
                    const contentRows = await tx
                        .insert(opinionContentTable)
                        .values({
                            opinionId: opinion.id,
                            conversationContentId:
                                opinion.conversationContentId,
                            content: normalized.content.html,
                            contentPlainText: normalized.content.plainText,
                            isEdited: true,
                            editedByUserId: userId,
                            ...contentLanguageMetadataUpdateValues(language),
                        })
                        .returning({
                            id: opinionContentTable.id,
                            publicId: opinionContentTable.publicId,
                            createdAt: opinionContentTable.createdAt,
                        });
                    const content = contentRows.at(0);
                    if (content === undefined)
                        throw new Error(
                            "Statement content insertion returned no row",
                        );
                    wasEdited = true;
                    await tx
                        .update(opinionTable)
                        .set({
                            currentContentId: content.id,
                            updatedAt: content.createdAt,
                        })
                        .where(eq(opinionTable.id, opinion.id));
                    await scheduleConversationAnalysisRefresh({
                        db: tx,
                        conversationId: opinion.conversationId,
                        log,
                    });
                    await createConversationViewSnapshotsFromCurrentState({
                        db: tx,
                        conversationId: opinion.conversationId,
                        viewReason: "conversation_content_updated",
                        emitCommentStatsRealtimeEvent: true,
                    });
                    await queueOpinionUpdatedEvent({
                        db: tx,
                        data: {
                            conversationSlugId: opinion.conversationSlugId,
                            opinionSlugId: opinion.slugId,
                            previousSourceVersion: opinion.sourceVersion,
                            sourceVersion: content.publicId,
                            opinion: normalized.content.html,
                            sourceLanguageCode: language.sourceLanguageCode,
                            timestamp: Date.now(),
                        },
                    });
                    if (opinion.isSeed)
                        translationWorkIds =
                            await createEagerContentTranslationWorkForConversation(
                                {
                                    db: tx,
                                    conversationSlugId:
                                        opinion.conversationSlugId,
                                    now: content.createdAt,
                                    log,
                                },
                            );
                }
                // Localization needs the existing policy/translation mapper. Read in
                // this write transaction so the response cannot regress through a replica.
                const displayed = await fetchOpinionsByOpinionSlugIdList({
                    db: tx,
                    opinionSlugIdList: [opinion.slugId],
                    displayContentViewerPreferences: {
                        viewerUserId: userId,
                        displayLanguage,
                        spokenLanguages,
                    },
                });
                const saved = displayed.at(0);
                if (saved === undefined)
                    throw new Error("Saved statement is not readable");
                if (
                    wasEdited &&
                    (!saved.management?.canEdit ||
                        (await voteBuffer.hasBlockingVotes({
                            opinionId: opinion.id,
                            authorId: opinion.authorId,
                            isSeed: opinion.isSeed,
                        })))
                ) {
                    // Rejecting after staging rows must roll back the content, outbox,
                    // and translation work together; returning a failure would commit them.
                    throw blockedDuringSave;
                }
                return { success: true, displayedOpinionItem: saved };
            },
        );
    } catch (error: unknown) {
        if (error === blockedDuringSave)
            return { success: false, reason: "has_votes" };
        throw error;
    }
    if (response.success && translationWorkIds.length > 0)
        await enqueueEagerContentTranslationWork({
            valkey,
            queueScript: translationQueueScript,
            workIds: translationWorkIds,
            now: new Date(),
            log,
        });
    return response;
}
