import { toEncodedCID } from "@/shared/common/cid.js";
import { count, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { generateRandomSlugId } from "../crypto.js";
import {
    commentTable,
    pollOptionsTable,
    pollResponseTable,
    pollTable,
} from "../schema.js";
import { Presentation, initializeWasm } from "@docknetwork/crypto-wasm-ts";

interface CreateSlugProps {
    db: PostgresJsDatabase;
}

interface UpdateLastReactedAtProps {
    db: PostgresJsDatabase;
}

interface UpdateCommentAmountProps {
    db: PostgresJsDatabase;
}

interface UpdatePollOptionsProps {
    db: PostgresJsDatabase;
}

export class Service {
    static async updatePollOptions({ db }: UpdatePollOptionsProps) {
        const results = await db
            .select({
                id: pollTable.id,
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
            })
            .from(pollTable);
        for (const result of results) {
            await db.insert(pollOptionsTable).values({
                postId: result.id,
                option1: result.option1,
                option2: result.option2,
                option3: result.option3,
                option4: result.option4,
                option5: result.option5,
                option6: result.option6,
                option1Response: result.option1Response,
                option2Response: result.option2Response,
                option3Response: result.option3Response,
                option4Response: result.option4Response,
                option5Response: result.option5Response,
                option6Response: result.option6Response,
            });
        }
    }

    static async updateCommentAmount({ db }: UpdateCommentAmountProps) {
        const results = await db
            .select({
                id: pollTable.id,
            })
            .from(pollTable);
        for (const result of results) {
            const resultsComment = await db
                .select({
                    commentCount: count(commentTable.id),
                })
                .from(commentTable)
                .where(eq(commentTable.postId, result.id));
            const resultComment = resultsComment[0];
            await db
                .update(pollTable)
                .set({
                    commentCount: resultComment.commentCount,
                })
                .where(eq(pollTable.id, result.id));
        }
    }

    static async updateLastReactedAt({ db }: UpdateLastReactedAtProps) {
        const results = await db
            .select({
                id: pollTable.id,
                updatedAt: pollTable.updatedAt,
                lastReactedAt: pollTable.lastReactedAt,
            })
            .from(pollTable);
        for (const result of results) {
            await db
                .update(pollTable)
                .set({
                    lastReactedAt: result.updatedAt,
                })
                .where(eq(pollTable.id, result.id));
        }
    }

    static async createSlugIdAndPresentationCID({
        db,
    }: CreateSlugProps): Promise<void> {
        await initializeWasm();
        const results = await db
            .select({
                pollId: pollTable.id,
                presentation: pollTable.presentation,
                createdAt: pollTable.createdAt,
            })
            .from(pollTable);
        for (const result of results) {
            const presentationCID = await toEncodedCID(result.presentation);
            console.log(
                `Poll updated at ${
                    result.createdAt
                } ${result.createdAt.getMilliseconds()}`
            );
            await db
                .update(pollTable)
                .set({
                    slugId: generateRandomSlugId(),
                    presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
                })
                .where(eq(pollTable.id, result.pollId));
        }

        const resultPollResponse = await db
            .select({
                id: pollResponseTable.id,
                presentation: pollResponseTable.presentation,
                createdAt: pollResponseTable.createdAt,
            })
            .from(pollResponseTable);
        for (const result of resultPollResponse) {
            console.log(
                `Response updated at ${
                    result.createdAt
                } ${result.createdAt.getMilliseconds()}`
            );
            const presentationCID = await toEncodedCID(result.presentation);
            const timestampedPresentation = {
                timestamp: result.createdAt.getTime(),
                presentation: Presentation.fromJSON(result.presentation),
            };
            const timestampedPresentationCID = await toEncodedCID(
                timestampedPresentation
            );
            await db
                .update(pollResponseTable)
                .set({
                    presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
                    timestampedPresentationCID: timestampedPresentationCID,
                })
                .where(eq(pollResponseTable.id, result.id));
        }
    }
}
