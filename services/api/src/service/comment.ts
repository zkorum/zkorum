import { server } from "@/app.js";
import { generateRandomSlugId } from "@/crypto.js";
import { commentContentTable, commentTable, masterProofTable, postTable } from "@/schema.js";
import type { CreateCommentResponse } from "@/shared/types/dto.js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";

export async function postNewComment(
    db: PostgresJsDatabase,
    commentBody: string,
    postSlugId: string,
    userId: string,
    didWrite: string,
    authHeader: string): Promise<CreateCommentResponse> {

    try {
        const commentSlugId = generateRandomSlugId();

        const postTableResponse = await db
            .select({
                id: postTable.id,
            })
            .from(postTable)
            .where(eq(postTable.slugId, postSlugId));

        if (postTableResponse.length != 1) {
            return {
                isSuccessful: false
            };
        }

        const postId = postTableResponse[0].id;
        
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
                postId: postId,
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