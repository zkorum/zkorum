import { and, eq, inArray, isNotNull, isNull, ne, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    conversationTable,
    conversationModerationTable,
    opinionModerationTable,
    opinionTable,
    voteTable,
} from "@/shared-backend/schema.js";
import { getProjectCapabilitiesById } from "./projectAccess.js";

export interface OpinionManagementCapabilities {
    readonly canEdit: boolean;
    readonly canDelete: boolean;
}

export async function canManageOpinion({
    db,
    userId,
    opinion,
    lockAuthorization = false,
}: {
    db: PostgresJsDatabase;
    userId: string;
    opinion: {
        readonly authorId: string;
        readonly isSeed: boolean;
        readonly projectId: number;
    };
    lockAuthorization?: boolean;
}): Promise<boolean> {
    if (!opinion.isSeed) return opinion.authorId === userId;
    const capabilities = await getProjectCapabilitiesById({
        db,
        userId,
        projectIds: [opinion.projectId],
        requestedCapabilities: ["conversation_edit"],
        lockAuthorization,
    });
    return (
        capabilities.get(opinion.projectId)?.has("conversation_edit") === true
    );
}

export async function hasBlockingOpinionVotes({
    db,
    opinionId,
    authorId,
    isSeed,
}: {
    db: PostgresJsDatabase;
    opinionId: number;
    authorId: string;
    isSeed: boolean;
}): Promise<boolean> {
    const rows = await db
        .select({ id: voteTable.id })
        .from(voteTable)
        .where(
            and(
                eq(voteTable.opinionId, opinionId),
                isNotNull(voteTable.currentContentId),
                isSeed ? undefined : ne(voteTable.authorId, authorId),
            ),
        )
        .limit(1);
    return rows.length > 0;
}

export async function getOpinionManagementCapabilities({
    db,
    opinionSlugIds,
    userId,
    lockAuthorization = false,
}: {
    db: PostgresJsDatabase;
    opinionSlugIds: readonly string[];
    userId: string | undefined;
    lockAuthorization?: boolean;
}): Promise<ReadonlyMap<string, OpinionManagementCapabilities>> {
    const capabilities = new Map<string, OpinionManagementCapabilities>();
    if (userId === undefined || opinionSlugIds.length === 0)
        return capabilities;
    const opinions = await db
        .select({
            id: opinionTable.id,
            slugId: opinionTable.slugId,
            authorId: opinionTable.authorId,
            isSeed: opinionTable.isSeed,
            projectId: conversationTable.projectId,
            conversationLocked: conversationModerationTable.id,
            moderationAction: opinionModerationTable.moderationAction,
            isImporting: conversationTable.isImporting,
        })
        .from(opinionTable)
        .innerJoin(
            conversationTable,
            eq(conversationTable.id, opinionTable.conversationId),
        )
        .leftJoin(
            conversationModerationTable,
            and(
                eq(
                    conversationModerationTable.conversationId,
                    conversationTable.id,
                ),
                isNull(conversationModerationTable.deletedAt),
            ),
        )
        .leftJoin(
            opinionModerationTable,
            and(
                eq(opinionModerationTable.opinionId, opinionTable.id),
                isNull(opinionModerationTable.deletedAt),
            ),
        )
        .where(
            and(
                inArray(opinionTable.slugId, [...opinionSlugIds]),
                isNotNull(opinionTable.currentContentId),
                isNotNull(conversationTable.currentContentId),
            ),
        );
    if (opinions.length === 0) return capabilities;
    const projectCapabilities = await getProjectCapabilitiesById({
        db,
        userId,
        projectIds: [
            ...new Set(
                opinions
                    .filter((opinion) => opinion.isSeed)
                    .map((opinion) => opinion.projectId),
            ),
        ],
        requestedCapabilities: ["conversation_edit"],
        lockAuthorization,
    });
    const canManage = (opinion: (typeof opinions)[number]): boolean =>
        opinion.isSeed
            ? projectCapabilities
                  .get(opinion.projectId)
                  ?.has("conversation_edit") === true
            : opinion.authorId === userId;
    const managedOpinions = opinions.filter(canManage);
    const blockingVotes =
        managedOpinions.length === 0
            ? []
            : await db
                  .select({ opinionId: voteTable.opinionId })
                  .from(voteTable)
                  .innerJoin(
                      opinionTable,
                      eq(opinionTable.id, voteTable.opinionId),
                  )
                  .where(
                      and(
                          inArray(
                              voteTable.opinionId,
                              managedOpinions.map((opinion) => opinion.id),
                          ),
                          isNotNull(voteTable.currentContentId),
                          or(
                              eq(opinionTable.isSeed, true),
                              ne(voteTable.authorId, opinionTable.authorId),
                          ),
                      ),
                  )
                  .groupBy(voteTable.opinionId);
    const blockedIds = new Set(blockingVotes.map((vote) => vote.opinionId));
    for (const opinion of opinions) {
        const canManageThisOpinion = canManage(opinion);
        capabilities.set(opinion.slugId, {
            canEdit:
                canManageThisOpinion &&
                !opinion.isImporting &&
                opinion.conversationLocked === null &&
                opinion.moderationAction !== "hide" &&
                !blockedIds.has(opinion.id),
            canDelete: canManageThisOpinion,
        });
    }
    return capabilities;
}
