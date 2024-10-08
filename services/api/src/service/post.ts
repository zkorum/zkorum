// Interact with a post
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { PostComment, SlugId } from "@/shared/types/zod.js";
import { commentContentTable, commentTable, deviceTable, postTable, userTable, voteContentTable, voteTable } from "@/schema.js";
import { and, asc, desc, eq, gt, lt, isNull, sql } from "drizzle-orm";
import type { FetchCommentsToVoteOn200 } from "@/shared/types/dto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";

interface FetchCommentsByPostIdProps {
    db: PostgresDatabase;
    postSlugId: SlugId;
    createdAt: Date | undefined;
    order: "more" | "recent";
    limit?: number;
    showHidden?: boolean;
}

interface FetchNextCommentsToVoteOn {
    db: PostgresDatabase;
    userId: string;
    postSlugId: SlugId;
    showHidden?: boolean;
    numberOfCommentsToFetch: number;
    httpErrors: HttpErrors;
}

export async function fetchCommentsByPostSlugId({
    db,
    postSlugId,
    order,
    showHidden,
    createdAt,
    limit,
}: FetchCommentsByPostIdProps): Promise<PostComment[]> {
    const actualLimit = limit === undefined ? 30 : limit;
    const whereCreatedAt =
        createdAt === undefined
            ? eq(postTable.slugId, postSlugId)
            : order === "more"
                ? and(
                    eq(postTable.slugId, postSlugId),
                    gt(commentTable.createdAt, createdAt)
                )
                : and(
                    eq(postTable.slugId, postSlugId),
                    lt(commentTable.createdAt, createdAt)
                );
    const results = await db
        .selectDistinctOn([commentTable.createdAt, commentTable.id], {
            // comment payload
            commentSlugId: commentTable.slugId,
            isHidden: commentTable.isHidden,
            createdAt: commentTable.createdAt,
            updatedAt: commentTable.updatedAt,
            comment: commentContentTable.content,
            numLikes: commentTable.numLikes,
            numDislikes: commentTable.numDislikes,
        })
        .from(commentTable)
        .innerJoin(
            postTable,
            eq(postTable.id, commentTable.postId)
        )
        .innerJoin(
            commentContentTable,
            eq(commentContentTable.id, commentTable.currentContentId)
        )
        .orderBy(asc(commentTable.createdAt), desc(commentTable.id))
        .limit(actualLimit)
        .where(
            showHidden === true
                ? whereCreatedAt
                : and(whereCreatedAt, eq(commentTable.isHidden, false))
        );
    return results;
}

export async function fetchNextCommentsToVoteOn({
    db,
    userId,
    postSlugId,
    showHidden,
    numberOfCommentsToFetch,
    httpErrors
}: FetchNextCommentsToVoteOn): Promise<FetchCommentsToVoteOn200> {
    if (numberOfCommentsToFetch > 15) {
        throw httpErrors.badRequest("The number of comments requested for voting cannot be above 15");
    }
    const whereClause = and(eq(postTable.slugId, postSlugId), isNull(voteTable.currentContentId))
    const results = await db
        .select({
            commentSlugId: commentTable.slugId,
        })
        .from(commentTable)
        .innerJoin(
            postTable,
            eq(postTable.id, commentTable.postId)
        )
        .leftJoin(
            voteTable,
            and(eq(voteTable.commentId, commentTable.id), eq(voteTable.authorId, userId))
        )
        .orderBy(sql`RANDOM()`)
        .limit(numberOfCommentsToFetch)
        .where(
            showHidden === true
                ? whereClause
                : and(whereClause, eq(commentTable.isHidden, false))
        );
    return {
        assignedCommentSlugIds: results.map((result) => result.commentSlugId)
    }
}
