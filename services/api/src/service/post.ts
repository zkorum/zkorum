// Interact with a post
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { SlugId } from "@/shared/types/zod.js";
import { commentContentTable, commentTable, pollTable, postContentTable, postProofTable, postTable, voteTable } from "@/schema.js";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { CreateNewPostResponse, FetchCommentsToVoteOn200, FetchPostBySlugIdResponse } from "@/shared/types/dto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { MAX_LENGTH_BODY } from "@/shared/shared.js";
import { generateRandomSlugId } from "@/crypto.js";
import { server } from "@/app.js";
import { useCommonPost } from "./common.js";
import { httpErrors } from "@fastify/sensible";
import { sanitizeHtmlBody } from "@/utils/htmlSanitization.js";

interface FetchNextCommentsToVoteOn {
    db: PostgresDatabase;
    userId: string;
    postSlugId: SlugId;
    numberOfCommentsToFetch: number;
    httpErrors: HttpErrors;
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
    };
}

interface CreateNewPostProps {
    db: PostgresDatabase;
    postTitle: string;
    postBody: string | null;
    pollingOptionList: string[] | null;
    authorId: string;
    didWrite: string;
    authHeader: string;
}

export async function createNewPost({
    db,
    postTitle,
    postBody,
    authorId,
    didWrite,
    authHeader,
    pollingOptionList
}: CreateNewPostProps): Promise<CreateNewPostResponse> {

    try {
        const postSlugId = generateRandomSlugId();

        if (postBody != null) {
            try {
                postBody = sanitizeHtmlBody(postBody, MAX_LENGTH_BODY);
            } catch (error) {
                if (error instanceof Error) {
                    throw httpErrors.badRequest(error.message);
                } else {
                    throw httpErrors.badRequest("Error while sanitizing request body");
                }
            }
        }

        await db.transaction(async (tx) => {
            const insertPostResponse = await tx.insert(postTable).values({
                authorId: authorId,
                slugId: postSlugId,
                commentCount: 0,
                currentContentId: null,
                isHidden: false,
                lastReactedAt: new Date()
            }).returning({ postId: postTable.id });

            const postId = insertPostResponse[0].postId

            const masterProofTableResponse = await tx.insert(postProofTable).values({
                type: "creation",
                postId: postId,
                authorDid: didWrite,
                proof: authHeader,
                proofVersion: 1
            }).returning({ proofId: postProofTable.id });

            const proofId = masterProofTableResponse[0].proofId;

            const postContentTableResponse = await tx.insert(postContentTable).values({
                postProofId: proofId,
                postId: postId,
                parentId: null,
                title: postTitle,
                body: postBody,
                pollId: null
            }).returning({ postContentId: postContentTable.id });

            const postContentId = postContentTableResponse[0].postContentId;

            await tx.update(postTable).set({
                currentContentId: postContentId,
            }).where(eq(postTable.id, postId));

            if (pollingOptionList != null) {

                await tx.insert(pollTable).values({
                    postContentId: postContentId,
                    option1: pollingOptionList[0],
                    option2: pollingOptionList[1],
                    option3: pollingOptionList[2] ?? null,
                    option4: pollingOptionList[3] ?? null,
                    option5: pollingOptionList[4] ?? null,
                    option6: pollingOptionList[5] ?? null,
                    option1Response: 0,
                    option2Response: 0,
                    option3Response: pollingOptionList[2] ? 0 : null,
                    option4Response: pollingOptionList[3] ? 0 : null,
                    option5Response: pollingOptionList[4] ? 0 : null,
                    option6Response: pollingOptionList[5] ? 0 : null
                });
            }

        });

        return {
            postSlugId: postSlugId
        };

    } catch (err: unknown) {
        console.log(err);
        throw httpErrors.internalServerError(
            "Database error while creating the new post"
        );
    }
}

export async function fetchPostBySlugId(
    db: PostgresDatabase,
    postSlugId: string): Promise<FetchPostBySlugIdResponse> {

    try {
        const { fetchPostItems } = useCommonPost();
        const postData = await fetchPostItems({
            db: db,
            showHidden: true,
            limit: 1,
            where: eq(postTable.slugId, postSlugId),
            enableCompactBody: false
        });

        if (postData.length == 1) {
            return {
                postData: postData[0]
            };
        } else {
            throw httpErrors.notFound(
                "Failed to locate post slug ID in the database: " + postSlugId
            );
        }
    } catch (err: unknown) {
        server.log.error(err);
        throw httpErrors.internalServerError(
            "Failed to fetch post by slug ID: " + postSlugId
        );
    }
}
