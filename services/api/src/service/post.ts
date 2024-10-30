// Interact with a post
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import type { SlugId } from "@/shared/types/zod.js";
import { commentContentTable, commentTable, masterProofTable, postContentTable, postTable, voteTable } from "@/schema.js";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { CreateNewPostResponse, FetchCommentsToVoteOn200, FetchPostBySlugIdResponse } from "@/shared/types/dto.js";
import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
import { MAX_LENGTH_BODY } from "@/shared/shared.js";
import { generateRandomSlugId } from "@/crypto.js";
import { server } from "@/app.js";
import { useCommonPost } from "./common.js";
import sanitizeHtml from "sanitize-html";
import { httpErrors } from "@fastify/sensible";

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

export async function createNewPost(
    db: PostgresDatabase,
    postTitle: string,
    postBody: string | null,
    authorId: string,
    didWrite: string,
    authHeader: string): Promise<CreateNewPostResponse> {

    try {
        const postSlugId = generateRandomSlugId();

        if (postBody != null) {
            {
                const options: sanitizeHtml.IOptions = {
                    allowedTags: ["b", "br", "i", "strike", "u", "div"],
                };
                postBody = sanitizeHtml(postBody, options);
            }

            {
                const options: sanitizeHtml.IOptions = {
                    allowedTags: [],
                    allowedAttributes: {}
                };
                const rawTextWithoutTags = sanitizeHtml(postBody, options);
                if (rawTextWithoutTags.length > MAX_LENGTH_BODY) {
                    throw httpErrors.badRequest(
                        "Incoming post's body had exceeded the max both length: " + rawTextWithoutTags.length.toString() + ". " +
                        "Max allowed: " + MAX_LENGTH_BODY.toString()
                    );
                }
            }

        }

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
        const postData = await fetchPostItems(db, true, 1, eq(postTable.slugId, postSlugId), false);

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