import { and, eq, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { getPrimaryDatabase } from "@/shared-backend/db.js";
import { conversationTable } from "@/shared-backend/schema.js";
import { zodSlugId } from "@/shared/types/zod.js";

const conversationIndexingRequest = z.strictObject({
    conversationSlugId: zodSlugId.min(1).regex(/^[A-Za-z0-9_-]+$/),
});
const conversationIndexingResponse = z.strictObject({
    isIndexed: z.boolean(),
});
export type ConversationIndexingRequest = z.infer<
    typeof conversationIndexingRequest
>;

export async function isConversationIndexable({
    db,
    conversationSlugId,
}: ConversationIndexingRequest & {
    db: PostgresJsDatabase;
}): Promise<boolean> {
    // This independent crawler request cannot reuse a write result. Read the
    // writer so making a conversation unlisted takes effect despite replica lag.
    const conversations = await getPrimaryDatabase(db)
        .select({ id: conversationTable.id })
        .from(conversationTable)
        .where(
            and(
                eq(conversationTable.slugId, conversationSlugId),
                eq(conversationTable.isIndexed, true),
                eq(conversationTable.isImporting, false),
                isNotNull(conversationTable.currentContentId),
            ),
        )
        .limit(1);

    return conversations.length > 0;
}

export function registerConversationIndexingRoute({
    server,
    apiVersion,
    isIndexable,
}: {
    server: FastifyInstance;
    apiVersion: string;
    isIndexable: (request: ConversationIndexingRequest) => Promise<boolean>;
}): void {
    server.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: `/api/${apiVersion}/conversation/indexing`,
        bodyLimit: 1024,
        schema: {
            security: [],
            description:
                "Resolve the indexing policy for conversation HTML responses",
            body: conversationIndexingRequest,
            response: { 200: conversationIndexingResponse },
        },
        handler: async (request, reply) => {
            reply.header("Cache-Control", "no-store");
            reply.header("X-Robots-Tag", "noindex, nofollow");
            const isIndexed = await isIndexable(request.body);
            // nginx only permits indexing when it receives this explicit value.
            reply.header(
                "X-Conversation-Indexing",
                isIndexed ? "index" : "noindex",
            );
            return { isIndexed };
        },
    });
}
