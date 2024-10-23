// Interact with a post
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { ExtendedPostPayload, PollOptionWithResult, PostComment, PostMetadata, SlugId } from "@/shared/types/zod.js";
import { commentContentTable, commentTable, masterProofTable, organisationTable, pollResponseContentTable, pollResponseTable, pollTable, postContentTable, postTable, userTable, voteContentTable, voteTable } from "@/schema.js";
import { and, asc, desc, eq, gt, lt, isNull, sql } from "drizzle-orm";
import type { CreateNewPostResponse, FetchCommentsToVoteOn200, FetchPostBySlugIdResponse } from "@/shared/types/dto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { toUnionUndefined } from "@/shared/shared.js";
import { generateRandomSlugId } from "@/crypto.js";
import { server } from "@/app.js";

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

export async function createNewPost(
    db: PostgresDatabase,
    postTitle: string,
    postBody: string | null,
    authorId: string,
    didWrite: string,
    authHeader: string): Promise<CreateNewPostResponse> {

    try {
        const postSlugId = generateRandomSlugId();

        await db.transaction(async (tx) => {

            const masterProofTableResponse = await tx.insert(masterProofTable).values({
                type: "creation",
                authorDid: didWrite,
                proof: authHeader,
                proofVersion: 0
            }).returning({ proofId: masterProofTable.id });

            const proofId = masterProofTableResponse[0].proofId;

            const postContentTableResponse = await tx.insert(postContentTable).values({
                postProofId: proofId,
                parentId: null,
                title: postTitle,
                body: postBody,
                pollId: null
            }).returning({ postContentId: postContentTable.id });

            const postContentId = postContentTableResponse[0].postContentId;

            await tx.insert(postTable).values({
                authorId: authorId,
                slugId: postSlugId, 
                commentCount: 0,
                currentContentId: postContentId,
                isHidden: false,
                lastReactedAt: new Date()
            });
        });

        return {
            isSuccessful: true,
            postSlugId: postSlugId
        }

    } catch (err: unknown) {
        server.log.error(err);
        return {
            isSuccessful: false
        }
    }
}

export async function fetchPostBySlugId(
    db: PostgresDatabase,
    postSlugId: string): Promise<FetchPostBySlugIdResponse> {

    try {
        const results = await db
            .select({
                title: postContentTable.title,
                body: postContentTable.body,
                option1: pollTable.option1,
                option1Response: pollTable.option1Response,
                option2: pollTable.option2,
                option2Response: pollTable.option2Response,
                option3: pollTable.option3,
                option3Response: pollTable.option3Response,
                option4: pollTable.option4,
                option4Response: pollTable.option4Response,
                option5: pollTable.option5,
                option5Response: pollTable.option5Response,
                option6: pollTable.option6,
                option6Response: pollTable.option6Response,
                optionChosen: pollResponseContentTable.optionChosen,
                // metadata
                slugId: postTable.slugId,
                isHidden: postTable.isHidden,
                createdAt: postTable.createdAt,
                updatedAt: postTable.updatedAt,
                lastReactedAt: postTable.lastReactedAt,
                commentCount: postTable.commentCount,
                authorName: organisationTable.name,
                authorImagePath: organisationTable.imageUrl,
            })
            .from(postTable)
            .leftJoin(
                postContentTable,
                eq(postContentTable.id, postTable.currentContentId)
            )
            .leftJoin(
                userTable,
                eq(userTable.id, postTable.authorId)
            )
            .leftJoin(
                organisationTable,
                eq(organisationTable.id, userTable.organisationId)
            )
            .leftJoin(pollTable, eq(postContentTable.id, pollTable.postContentId))
            .leftJoin(pollResponseTable, and(eq(postTable.id, pollResponseTable.postId), eq(userTable.id, pollResponseTable.authorId)))
            .leftJoin(pollResponseContentTable, eq(pollResponseContentTable.id, pollResponseTable.currentContentId))
            .orderBy(desc(postTable.lastReactedAt), desc(postTable.id))
            .where(
                eq(postTable.slugId, postSlugId)
        );

        if (results.length == 0) {
            return {
                isSuccessful: false
            }
        }

        const result = results[0];
        
        const metadata: PostMetadata = {
            postSlugId: result.slugId,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            lastReactedAt: result.lastReactedAt,
            commentCount: result.commentCount,
            authorName: toUnionUndefined(result.authorName),
            authorImagePath: toUnionUndefined(result.authorImagePath)
        };

        let payload: ExtendedPostPayload;
        if (result.option1 !== null && result.option2 !== null && result.option1Response !== null && result.option2Response !== null) { // hasPoll
            const poll: PollOptionWithResult[] = [{
                index: 1,
                option: result.option1,
                numResponses: result.option1Response,
                isChosen: result.optionChosen === 1
            },
            {
                index: 2,
                option: result.option2,
                numResponses: result.option2Response,
                isChosen: result.optionChosen === 2
            }]
            if (result.option3 !== null) {
                poll.push({
                    index: 3,
                    option: result.option3,
                    numResponses: result.option3Response ?? 0,
                    isChosen: result.optionChosen === 3
                })
            }
            if (result.option4 !== null) {
                poll.push({
                    index: 4,
                    option: result.option4,
                    numResponses: result.option4Response ?? 0,
                    isChosen: result.optionChosen === 4

                })
            }
            if (result.option5 !== null) {
                poll.push({
                    index: 5,
                    option: result.option5,
                    numResponses: result.option5Response ?? 0,
                    isChosen: result.optionChosen === 5
                })
            }
            if (result.option6 !== null) {
                poll.push({
                    index: 6,
                    option: result.option6,
                    numResponses: result.option6Response ?? 0,
                    isChosen: result.optionChosen === 6
                })
            }
            payload = {
                title: result.title ?? "", // Typescript inference limitation
                body: toUnionUndefined(result.body),
                poll: poll,
            }
        } else {
            payload = {
                title: result.title ?? "",
                body: toUnionUndefined(result.body),
            }
        }
  
        return {
            isSuccessful: true,
            postData: {
                metadata: metadata,
                payload: payload,
            }
        };

    } catch (err: unknown) {
        server.log.error(err);
        return {
            isSuccessful: false
        }
    }
}