import { postTable } from "@/schema.js";
import type { ExtendedPost } from "@/shared/types/zod.js";
import { and, eq, lt } from "drizzle-orm";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";
import type { FetchFeedResponse, FetchUserPollResponseResponse } from "@/shared/types/dto.js";
import { getUserPollResponse } from "./poll.js";
import { httpErrors } from "@fastify/sensible";

interface FetchFeedProps {
    db: PostgresDatabase;
    lastSlugId: string | undefined;
    limit?: number;
    showHidden?: boolean;
    fetchPollResponse: boolean;
    userId?: string;
}

export async function fetchFeed({
    db,
    lastSlugId,
    limit,
    showHidden,
    fetchPollResponse,
    userId
}: FetchFeedProps): Promise<FetchFeedResponse> {
    const defaultLimit = 10;
    const targetLimit = limit ?? defaultLimit;

    let lastCreatedAt = new Date();

    if (lastSlugId) {
        const selectResponse = await db
            .select({ createdAt: postTable.createdAt })
            .from(postTable)
            .where(eq(postTable.slugId, lastSlugId))
        if (selectResponse.length == 1) {
            lastCreatedAt = selectResponse[0].createdAt;
        } else {
            // Ignore the slug ID if it cannot be found
        }
    }

    let whereClause = showHidden ? undefined : eq(postTable.isHidden, false);
    if (lastSlugId) {
        whereClause = and(whereClause, lt(postTable.createdAt, lastCreatedAt));
    }

    const { fetchPostItems } = useCommonPost();

    const posts: ExtendedPost[] = await fetchPostItems({
        db: db,
        showHidden: showHidden ?? false,
        limit: targetLimit + 1,
        where: whereClause,
        enableCompactBody: true
    });

    let pollResponses: FetchUserPollResponseResponse | undefined = undefined;
    if (fetchPollResponse) {
        if (!userId) {
            throw httpErrors.internalServerError("Missing author ID for fetching poll response");
        } else {
            const postSlugIdList: string[] = [];
            posts.forEach(post => {
                postSlugIdList.push(post.metadata.postSlugId);
            });

            pollResponses = await getUserPollResponse({
                db: db,
                authorId: userId,
                httpErrors: httpErrors,
                postSlugIdList: postSlugIdList
            });
        }
    }

    return {
        postDataList: posts.length == targetLimit ? posts.splice(-1) : posts,
        reachedEndOfFeed: posts.length == targetLimit ? false : true,
        pollResponse: pollResponses
    };
}
