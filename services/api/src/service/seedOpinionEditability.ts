import {
    and,
    arrayContains,
    eq,
    exists,
    isNotNull,
    isNull,
    sql,
    type SQL,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    maxdiffComparisonTable,
    maxdiffResultTable,
    opinionTable,
    rankingItemTable,
    voteTable,
} from "@/shared-backend/schema.js";

export function seedOpinionHasVotes({
    db,
    opinionId,
}: {
    db: PostgresJsDatabase;
    opinionId: typeof opinionTable.id;
}): SQL<boolean> {
    return exists(
        db
            .select({ id: voteTable.id })
            .from(voteTable)
            .where(
                and(
                    eq(voteTable.opinionId, opinionId),
                    isNotNull(voteTable.currentContentId),
                ),
            ),
    ).mapWith(Boolean);
}

export function rankingSeedHasVotes({
    db,
    conversationId,
    slugId,
}: {
    db: PostgresJsDatabase;
    conversationId: number;
    slugId: typeof rankingItemTable.slugId;
}): SQL<boolean> {
    // Drizzle needs a PostgreSQL array expression to correlate the candidate set
    // with the outer item row, including items that were neither best nor worst.
    const candidate = sql`ARRAY[${slugId}::text]`;
    return exists(
        db
            .select({ id: maxdiffComparisonTable.id })
            .from(maxdiffComparisonTable)
            .innerJoin(
                maxdiffResultTable,
                eq(
                    maxdiffResultTable.id,
                    maxdiffComparisonTable.maxdiffResultId,
                ),
            )
            .where(
                and(
                    eq(maxdiffResultTable.conversationId, conversationId),
                    isNull(maxdiffComparisonTable.deletedAt),
                    arrayContains(
                        maxdiffComparisonTable.candidateSet,
                        candidate,
                    ),
                ),
            ),
    ).mapWith(Boolean);
}
