import { server } from "@/app.js";
import { generateRandomSlugId } from "@/crypto.js";
import { masterProofTable, postContentTable, postTable } from "@/schema.js";
import type { CreateNewPostResponse } from "@/shared/types/dto.js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export async function postNewComment(
    db: PostgresJsDatabase,
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
        };

    } catch (err: unknown) {
        server.log.error(err);
        return {
            isSuccessful: false
        };
    }
}