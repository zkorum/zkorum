import { and, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    conversationTable,
    opinionTable,
    voteTable,
} from "@/shared-backend/schema.js";
import { getProjectCapabilitiesById } from "./projectAccess.js";

export interface OpinionManagementCapabilities {
    canEdit: boolean;
    canDelete: boolean;
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
        })
        .from(opinionTable)
        .innerJoin(
            conversationTable,
            eq(conversationTable.id, opinionTable.conversationId),
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
    const blockingVotes = await db
        .select({ opinionId: voteTable.opinionId })
        .from(voteTable)
        .innerJoin(opinionTable, eq(opinionTable.id, voteTable.opinionId))
        .where(
            and(
                inArray(
                    voteTable.opinionId,
                    opinions.map((opinion) => opinion.id),
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
        const canManage = opinion.isSeed
            ? projectCapabilities
                  .get(opinion.projectId)
                  ?.has("conversation_edit") === true
            : opinion.authorId === userId;
        capabilities.set(opinion.slugId, {
            canEdit: canManage && !blockedIds.has(opinion.id),
            canDelete: canManage,
        });
    }
    return capabilities;
}
