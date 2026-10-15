import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { SqlExpression } from "@/utils/sqlExpression.js";
import {
    conversationTable,
    conversationViewSnapshotTable,
    rankingConversationConfigTable,
    rankingConversationStatsSnapshotTable,
} from "@/shared-backend/schema.js";

export interface ConversationDisplayCounts {
    conversationId: number;
    conversationViewSnapshotId: number;
    rankingStatsSnapshotId: number | undefined;
    opinionCount: number;
    voteCount: number;
    participantCount: number;
    totalOpinionCount: number;
    totalVoteCount: number;
    totalParticipantCount: number;
    moderatedOpinionCount: number;
    hiddenOpinionCount: number;
}

export function conversationDisplayCount({
    rankingCount,
    snapshotCount,
}: {
    rankingCount: SqlExpression<number>;
    snapshotCount: SqlExpression<number>;
}) {
    // PostgreSQL CASE/greatest have no Drizzle helpers. Imported ranking counts
    // retain the snapshot baseline only until the first completed scoring pass.
    return sql<number>`case when ${conversationTable.conversationType} = 'ranking' then
        case when ${rankingConversationConfigTable.processedScoringInputRevision} >= 0
            then ${rankingCount} else greatest(${rankingCount}, ${snapshotCount}) end
        else ${snapshotCount} end`.mapWith(Number);
}

export function latestConversationDisplaySnapshot(db: PostgresJsDatabase) {
    return db
        .select({
            conversationViewSnapshotId: conversationViewSnapshotTable.id,
            opinionCount: conversationViewSnapshotTable.opinionCount,
            voteCount: conversationViewSnapshotTable.voteCount,
            participantCount: conversationViewSnapshotTable.participantCount,
            totalOpinionCount: conversationViewSnapshotTable.totalOpinionCount,
            totalVoteCount: conversationViewSnapshotTable.totalVoteCount,
            totalParticipantCount:
                conversationViewSnapshotTable.totalParticipantCount,
            moderatedOpinionCount:
                conversationViewSnapshotTable.moderatedOpinionCount,
            hiddenOpinionCount:
                conversationViewSnapshotTable.hiddenOpinionCount,
        })
        .from(conversationViewSnapshotTable)
        .where(
            and(
                eq(
                    conversationViewSnapshotTable.conversationId,
                    conversationTable.id,
                ),
                isNotNull(conversationViewSnapshotTable.activatedAt),
            ),
        )
        .orderBy(
            desc(conversationViewSnapshotTable.createdAt),
            desc(conversationViewSnapshotTable.id),
        )
        .limit(1)
        .as("latest_conversation_display_snapshot");
}

function buildConversationDisplayCountsQuery({
    db,
    conversationIds,
}: {
    db: PostgresJsDatabase;
    conversationIds: readonly number[];
}) {
    const latestSnapshot = latestConversationDisplaySnapshot(db);
    const latestRankingSnapshot = db
        .select({
            rankingStatsSnapshotId: rankingConversationStatsSnapshotTable.id,
        })
        .from(rankingConversationStatsSnapshotTable)
        .where(
            and(
                eq(
                    rankingConversationStatsSnapshotTable.conversationId,
                    conversationTable.id,
                ),
                eq(conversationTable.conversationType, "ranking"),
                isNull(rankingConversationStatsSnapshotTable.deletedAt),
            ),
        )
        .orderBy(
            desc(rankingConversationStatsSnapshotTable.createdAt),
            desc(rankingConversationStatsSnapshotTable.id),
        )
        .limit(1)
        .as("latest_ranking_stats_snapshot");
    return db
        .select({
            conversationId: conversationTable.id,
            conversationViewSnapshotId:
                latestSnapshot.conversationViewSnapshotId,
            rankingStatsSnapshotId:
                latestRankingSnapshot.rankingStatsSnapshotId,
            opinionCount: conversationDisplayCount({
                rankingCount: rankingConversationConfigTable.itemCount,
                snapshotCount: latestSnapshot.opinionCount,
            }),
            voteCount: conversationDisplayCount({
                rankingCount: rankingConversationConfigTable.voteCount,
                snapshotCount: latestSnapshot.voteCount,
            }),
            participantCount: conversationDisplayCount({
                rankingCount: rankingConversationConfigTable.participantCount,
                snapshotCount: latestSnapshot.participantCount,
            }),
            totalOpinionCount: conversationDisplayCount({
                rankingCount: rankingConversationConfigTable.totalItemCount,
                snapshotCount: latestSnapshot.totalOpinionCount,
            }),
            totalVoteCount: conversationDisplayCount({
                rankingCount: rankingConversationConfigTable.totalVoteCount,
                snapshotCount: latestSnapshot.totalVoteCount,
            }),
            totalParticipantCount: conversationDisplayCount({
                rankingCount:
                    rankingConversationConfigTable.totalParticipantCount,
                snapshotCount: latestSnapshot.totalParticipantCount,
            }),
            moderatedOpinionCount:
                sql<number>`case when ${conversationTable.conversationType} = 'ranking' then 0 else ${latestSnapshot.moderatedOpinionCount} end`.mapWith(
                    Number,
                ),
            hiddenOpinionCount:
                sql<number>`case when ${conversationTable.conversationType} = 'ranking' then 0 else ${latestSnapshot.hiddenOpinionCount} end`.mapWith(
                    Number,
                ),
        })
        .from(conversationTable)
        .innerJoinLateral(latestSnapshot, sql`true`)
        .leftJoin(
            rankingConversationConfigTable,
            eq(
                rankingConversationConfigTable.id,
                conversationTable.rankingConfigId,
            ),
        )
        .leftJoinLateral(latestRankingSnapshot, sql`true`)
        .where(inArray(conversationTable.id, conversationIds));
}

export async function fetchConversationDisplayCountsByConversationId({
    db,
    conversationIds,
}: {
    db: PostgresJsDatabase;
    conversationIds: number[];
}): Promise<Map<number, ConversationDisplayCounts>> {
    const uniqueConversationIds = Array.from(new Set(conversationIds));
    if (uniqueConversationIds.length === 0) return new Map();
    const rows = await buildConversationDisplayCountsQuery({
        db,
        conversationIds: uniqueConversationIds,
    });

    const countsByConversationId = new Map<number, ConversationDisplayCounts>();
    for (const row of rows) {
        countsByConversationId.set(row.conversationId, {
            ...row,
            rankingStatsSnapshotId: row.rankingStatsSnapshotId ?? undefined,
        });
    }
    return countsByConversationId;
}
