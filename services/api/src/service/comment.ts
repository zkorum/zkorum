import { server } from "@/app.js";
import { generateRandomSlugId } from "@/crypto.js";
import { commentContentTable, commentTable, masterProofTable, postTable } from "@/schema.js";
import type { CreateCommentResponse } from "@/shared/types/dto.js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { CommentItem, SlugId } from "@/shared/types/zod.js";

export async function fetchCommentsByPostSlugId(
    db: PostgresJsDatabase,
    postSlugId: SlugId): Promise<CommentItem[]> {

    const postId = await getPostIdFromPostSlugId(db, postSlugId);
    if (postId == null) {
        return [];
    }

    const results = await db
        .select({
            // comment payload
            commentSlugId: commentTable.slugId,
            isHidden: commentTable.isHidden,
            createdAt: commentTable.createdAt,
            updatedAt: commentTable.updatedAt,
            comment: commentContentTable.content,
            numLikes: commentTable.numLikes,
            numDislikes: commentTable.numDislikes
        })
        .from(commentTable)
        .innerJoin(
            postTable,
            eq(postTable.id, postId)
        )
        .innerJoin(
            commentContentTable,
            eq(commentContentTable.id, commentTable.currentContentId)
        )
        .orderBy(asc(commentTable.createdAt), desc(commentTable.id))
        .where(
            eq(commentTable.postId, postId)
        );
    
    const commentItemList: CommentItem[] = [];
    results.map((commentResponse) => {
        const item: CommentItem = {
            comment: commentResponse.comment,
            commentSlugId: commentResponse.commentSlugId,
            createdAt: commentResponse.createdAt,
            numDislikes: commentResponse.numDislikes,
            numLikes: commentResponse.numLikes,
            updatedAt: commentResponse.updatedAt,
            isHidden: commentResponse.isHidden
        };
        commentItemList.push(item);
    });
    
    return commentItemList;

    /*
    const actualLimit = limit ?? 30;
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
            };
        });
    }
    */
}

async function getPostIdFromPostSlugId(
    db: PostgresJsDatabase,
    postSlugId: string) {
    
    const postTableResponse = await db
        .select({
            id: postTable.id,
        })
        .from(postTable)
        .where(eq(postTable.slugId, postSlugId));

    if (postTableResponse.length != 1) {
        return null;
    }

    const postId = postTableResponse[0].id;
    return postId;
}

export async function postNewComment(
    db: PostgresJsDatabase,
    commentBody: string,
    postSlugId: string,
    userId: string,
    didWrite: string,
    authHeader: string): Promise<CreateCommentResponse> {

    try {
        const postId = await getPostIdFromPostSlugId(db, postSlugId);
        if (postId == null) {
            return {
                isSuccessful: false
            };
        }

        const commentSlugId = generateRandomSlugId();

        await db.transaction(async (tx) => {

            const masterProofTableResponse = await tx.insert(masterProofTable).values({
                type: "creation",
                authorDid: didWrite,
                proof: authHeader,
                proofVersion: 0
            }).returning({ proofId: masterProofTable.id });

            const proofId = masterProofTableResponse[0].proofId;

            const commentContentTableResponse = await tx.insert(commentContentTable).values({
                commentProofId: proofId,
                parentId: null,
                content: commentBody
            }).returning({ commentContentTableId: commentContentTable.id });

            const commentContentTableId = commentContentTableResponse[0].commentContentTableId;

            await tx.insert(commentTable).values({
                slugId: commentSlugId,
                authorId: userId,
                currentContentId: commentContentTableId,
                isHidden: false,
                postId: postId
            });

            // Update comment count
            await db
                .update(postTable)
                .set({
                    commentCount: sql`${postTable.commentCount} + 1`
                })
                .where(eq(postTable.slugId, postSlugId));

        });

        return {
            isSuccessful: true,
            commentSlugId: ""
        };

    } catch (err: unknown) {
        server.log.error(err);
        return {
            isSuccessful: false
        };
    }
}