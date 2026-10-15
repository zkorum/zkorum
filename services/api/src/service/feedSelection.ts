import {
    conversationModerationTable,
    conversationTable,
    organizationTable,
    projectOrganizationOwnershipTable,
    projectTable,
    rankingConversationConfigTable,
    userMutePreferenceTable,
    userTable,
} from "@/shared-backend/schema.js";
import {
    FEED_HEAD_SIZE,
    FEED_PAGE_SIZE,
    type FetchFeedRequest,
} from "@/shared/types/dto.js";
import {
    and,
    desc,
    eq,
    exists,
    inArray,
    isNotNull,
    isNull,
    lt,
    notExists,
    or,
    sql,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
    conversationDisplayCount,
    latestConversationDisplaySnapshot,
} from "./conversationDisplayCounts.js";
import { conversationEngagementScore } from "./recommendationSystem.js";

interface FeedCandidate {
    conversationId: number;
    slugId: string;
    createdAt: Date;
}

type FeedSelection =
    | { sortAlgorithm: "new"; rows: FeedCandidate[] }
    | {
          sortAlgorithm: "following";
          rows: (FeedCandidate & { score: number })[];
          rankedAt: Date;
      };

/** Visibility is reapplied on every page; cursors never confer access. */
function feedVisibilityConditions({
    db,
    viewerId,
}: {
    db: PostgresJsDatabase;
    viewerId: string | undefined;
}) {
    const owner = db
        .select({ projectId: projectOrganizationOwnershipTable.projectId })
        .from(projectOrganizationOwnershipTable)
        .innerJoin(
            projectTable,
            eq(projectTable.id, projectOrganizationOwnershipTable.projectId),
        )
        .innerJoin(
            organizationTable,
            eq(
                organizationTable.id,
                projectOrganizationOwnershipTable.organizationId,
            ),
        )
        .leftJoin(
            userTable,
            eq(userTable.id, organizationTable.autoProvisionedForUserId),
        )
        .where(
            and(
                eq(
                    projectOrganizationOwnershipTable.projectId,
                    conversationTable.projectId,
                ),
                isNull(projectOrganizationOwnershipTable.deletedAt),
                isNull(projectTable.deletedAt),
                isNull(organizationTable.deletedAt),
                or(
                    isNull(organizationTable.autoProvisionedForUserId),
                    eq(userTable.isDeleted, false),
                ),
                viewerId === undefined
                    ? undefined
                    : notExists(
                          db
                              .select({ id: userMutePreferenceTable.id })
                              .from(userMutePreferenceTable)
                              .where(
                                  and(
                                      eq(
                                          userMutePreferenceTable.sourceUserId,
                                          viewerId,
                                      ),
                                      eq(
                                          userMutePreferenceTable.targetUserId,
                                          organizationTable.autoProvisionedForUserId,
                                      ),
                                      isNull(userMutePreferenceTable.deletedAt),
                                  ),
                              ),
                      ),
            ),
        );
    return and(
        eq(conversationTable.isIndexed, true),
        eq(conversationTable.isImporting, false),
        isNotNull(conversationTable.currentContentId),
        exists(owner),
        notExists(
            db
                .select({ id: conversationModerationTable.id })
                .from(conversationModerationTable)
                .where(
                    and(
                        eq(
                            conversationModerationTable.conversationId,
                            conversationTable.id,
                        ),
                        eq(
                            conversationModerationTable.moderationAction,
                            "lock",
                        ),
                        isNull(conversationModerationTable.deletedAt),
                    ),
                ),
        ),
    );
}

export async function selectFeedCandidates({
    db,
    viewerId,
    request,
    purpose,
}: {
    db: PostgresJsDatabase;
    viewerId: string | undefined;
    request: FetchFeedRequest;
    purpose: "page" | "head";
}): Promise<FeedSelection> {
    const limit = purpose === "page" ? FEED_PAGE_SIZE + 1 : FEED_HEAD_SIZE;
    const visibility = feedVisibilityConditions({ db, viewerId });
    const snapshot = latestConversationDisplaySnapshot(db);
    if (request.sortAlgorithm === "new") {
        const cursor = request.cursor;
        const afterCreatedCursor =
            cursor === null
                ? undefined
                : or(
                      lt(conversationTable.createdAt, cursor.createdAt),
                      and(
                          eq(conversationTable.createdAt, cursor.createdAt),
                          lt(conversationTable.id, cursor.conversationId),
                      ),
                  );
        const rows = await db
            .select({
                conversationId: conversationTable.id,
                slugId: conversationTable.slugId,
                createdAt: conversationTable.createdAt,
            })
            .from(conversationTable)
            .innerJoinLateral(snapshot, sql`true`)
            .where(and(visibility, afterCreatedCursor))
            .orderBy(
                desc(conversationTable.createdAt),
                desc(conversationTable.id),
            )
            .limit(limit);
        return { sortAlgorithm: "new", rows };
    }

    const rankedAt = request.cursor?.rankedAt ?? new Date();
    const score = conversationEngagementScore({
        createdAt: conversationTable.createdAt,
        lastReactedAt: conversationTable.lastReactedAt,
        opinionCount: conversationDisplayCount({
            rankingCount: rankingConversationConfigTable.itemCount,
            snapshotCount: snapshot.opinionCount,
        }),
        voteCount: conversationDisplayCount({
            rankingCount: rankingConversationConfigTable.voteCount,
            snapshotCount: snapshot.voteCount,
        }),
        participantCount: conversationDisplayCount({
            rankingCount: rankingConversationConfigTable.participantCount,
            snapshotCount: snapshot.participantCount,
        }),
        rankedAt,
    });
    const ranked = db
        .select({
            conversationId: conversationTable.id,
            slugId: conversationTable.slugId,
            createdAt: conversationTable.createdAt,
            score: score.as("engagement_score"),
        })
        .from(conversationTable)
        .innerJoinLateral(snapshot, sql`true`)
        .leftJoin(
            rankingConversationConfigTable,
            eq(
                rankingConversationConfigTable.id,
                conversationTable.rankingConfigId,
            ),
        )
        .where(visibility)
        .as("ranked_feed");
    const cursor = request.cursor;
    const rows = await db
        .select()
        .from(ranked)
        .where(
            cursor === null
                ? undefined
                : or(
                      lt(ranked.score, cursor.score),
                      and(
                          eq(ranked.score, cursor.score),
                          or(
                              lt(ranked.createdAt, cursor.createdAt),
                              and(
                                  eq(ranked.createdAt, cursor.createdAt),
                                  lt(
                                      ranked.conversationId,
                                      cursor.conversationId,
                                  ),
                              ),
                          ),
                      ),
                  ),
        )
        .orderBy(
            desc(ranked.score),
            desc(ranked.createdAt),
            desc(ranked.conversationId),
        )
        .limit(limit);
    return { sortAlgorithm: "following", rows, rankedAt };
}

export function selectedFeedConversations({
    db,
    viewerId,
    conversationIds,
}: {
    db: PostgresJsDatabase;
    viewerId: string | undefined;
    conversationIds: number[];
}) {
    // Recheck visibility during hydration as moderation/ownership may have changed.
    return and(
        inArray(conversationTable.id, conversationIds),
        feedVisibilityConditions({ db, viewerId }),
    );
}
