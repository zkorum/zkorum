// Interact with a post
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { PostComment, SlugId } from "@/shared/types/zod.js";
import { commentContentTable, commentTable, deviceTable, postTable, userTable, voteContentTable, voteTable,moderationTable} from "@/schema.js";
import { and, asc, desc, eq, gt, lt, isNull, sql } from "drizzle-orm";
import type { FetchCommentsToVoteOn200 } from "@/shared/types/dto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { toUnionUndefined } from "@/shared/shared.js";
// we have to define those
import { moderationActionEnum } from "@/shared/types/moderation.ts";
import { leftJoin, isNull } from "drizzle-orm";



interface HidePostParams {
    db: PostgresDatabase;
    postId: number;
    moderatorId: string;
    moderationReason: ModerationReason;
    moderationExplanation?: string;
  }


interface FetchCommentsByPostIdProps {
    db: PostgresDatabase;
    postSlugId: SlugId;
    userId?: string;
    createdAt: Date | undefined;
    order: "more" | "recent";
    limit?: number;
    showHidden?: boolean;
}

interface FetchNextCommentsToVoteOn {
    db: PostgresDatabase;
    userId: string;
    postSlugId: SlugId;
    numberOfCommentsToFetch: number;
    httpErrors: HttpErrors;
}

export async function fetchCommentsByPostSlugId({
    db,
    postSlugId,
    userId,
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
    if (userId === undefined) {
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
    } else {
        const results = await db
            .selectDistinctOn([commentTable.createdAt, commentTable.id], {
                commentSlugId: commentTable.slugId,
                isHidden: commentTable.isHidden,
                createdAt: commentTable.createdAt,
                updatedAt: commentTable.updatedAt,
                comment: commentContentTable.content,
                numLikes: commentTable.numLikes,
                numDislikes: commentTable.numDislikes,
                optionChosen: voteContentTable.optionChosen,
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
            .leftJoin(voteTable, and(eq(voteTable.authorId, userId), eq(voteTable.commentId, commentTable.id)))
            .leftJoin(voteContentTable, eq(voteContentTable.id, voteTable.currentContentId))
            .orderBy(asc(commentTable.createdAt), desc(commentTable.id))
            .limit(actualLimit)
            .where(
                showHidden === true
                    ? whereCreatedAt
                    : and(whereCreatedAt, eq(commentTable.isHidden, false))
            );
        return results.map((result) => {
            return {
                commentSlugId: result.commentSlugId,
                isHidden: result.isHidden,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                comment: result.comment,
                numLikes: result.numLikes,
                numDislikes: result.numDislikes,
                optionChosen: toUnionUndefined(result.optionChosen),
            }
        });
    }
}





export async function fetchNextCommentsToVoteOn({
    db,
    userId,
    postSlugId,
    numberOfCommentsToFetch,
    httpErrors
}: FetchNextCommentsToVoteOn): Promise<FetchCommentsToVoteOn200> {
    if (numberOfCommentsToFetch > 15) {
        throw httpErrors.badRequest("The number of comments requested for voting cannot be above 15");
    }
    const results = await db
        .select({
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
        .leftJoin(
            voteTable,
            and(eq(voteTable.commentId, commentTable.id), eq(voteTable.authorId, userId))
        )
        .orderBy(sql`RANDOM()`)
        .limit(numberOfCommentsToFetch)
        .where(
            and(
                eq(commentTable.isHidden, false),
                eq(postTable.slugId, postSlugId),
                isNull(voteTable.currentContentId)
            )
        );
    return {
        assignedComments: results
    }
}




/**
 * Hides a post by inserting a record into the moderationTable.
 * @param params - The parameters for hiding a post.
 */
export async function hidePost(params: HidePostParams): Promise<void> {
    const { db, postId, moderatorId, moderationReason, moderationExplanation } = params;
  
    await db
      .insert(moderationTable)
      .values({
        reportId: postId,
        moderatorId: moderatorId,
        moderationAction: 'hide',
        moderationReason: moderationReason,
        moderationExplanation: moderationExplanation,
      })
      .execute();
  }






  /**
 * Retrieves a post by its ID.
 * @param db - The database instance.
 * @param postId - The ID of the post.
 * @returns The post if found, otherwise null.
 */
export async function getPostById(
    db: PostgresDatabase,
    postId: number
  ): Promise<Post | null> {
    const result = await db
      .select()
      .from(postTable)
      .where(eq(postTable.id, postId))
      .limit(1)
      .execute();
  
    return result.length > 0 ? result[0] : null;
  }