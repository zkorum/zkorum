import { postTable } from "@/schema.js";
import type { ExtendedPost } from "@/shared/types/zod.js";
import { and, eq, gt, lt } from "drizzle-orm";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
import { useCommonPost } from "./common.js";

interface FetchFeedProps {
    db: PostgresDatabase;
    lastReactedAt: Date | undefined;
    order: "more" | "recent";
    limit?: number;
    showHidden?: boolean;
}

export async function fetchFeed({
    db,
    lastReactedAt,
    order,
    limit,
    showHidden,
}: FetchFeedProps): Promise<ExtendedPost[]> {
    const defaultLimit = 30;
    const actualLimit = limit ?? defaultLimit;
    const whereUpdatedAt =
        lastReactedAt === undefined
            ? undefined
            : order === "more"
                ? lt(postTable.lastReactedAt, lastReactedAt)
                : gt(postTable.lastReactedAt, lastReactedAt);

    const { fetchPostItems } = useCommonPost();

    const posts: ExtendedPost[] = await fetchPostItems({
        db: db,
        showHidden: showHidden ?? false,
        limit: actualLimit,
        where: showHidden === true
            ? whereUpdatedAt
            : and(whereUpdatedAt, eq(postTable.isHidden, false)),
        enableCompactBody: true
    });

    return posts;
}
