import { organisationTable, pollResponseContentTable, pollResponseTable, pollTable, postContentTable, postTable, userTable } from "@/schema.js";
import { toUnionUndefined } from "@/shared/shared.js";
import type { ExtendedPost, ExtendedPostPayload, PollOptionWithResult, PostMetadata } from "@/shared/types/zod.js";
import { and, desc, eq, gt, lt, type TablesRelationalConfig } from "drizzle-orm";
import type { PgTransaction, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";

interface FetchFeedProps<
    TQueryResult extends PgQueryResultHKT,
    TFullSchema extends Record<string, unknown>,
    TSchema extends TablesRelationalConfig,
> {
    db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
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
}: FetchFeedProps<
    PgQueryResultHKT,
    Record<string, unknown>,
    TablesRelationalConfig
>): Promise<ExtendedPost[]> {
    const defaultLimit = 30;
    const actualLimit = limit ?? defaultLimit;
    const whereUpdatedAt =
        lastReactedAt === undefined
            ? undefined
            : order === "more"
                ? lt(postTable.lastReactedAt, lastReactedAt)
                : gt(postTable.lastReactedAt, lastReactedAt);
    
    /*
    const result2 = await db.select({
        slugId: postTable.slugId,
        title: postContentTable.title,
        body: postContentTable.body,
    }).from(postTable)
        .leftJoin(
            postContentTable,
            eq(postContentTable.id, postTable.currentContentId)
        )
        .where(undefined)
        .orderBy(desc(postTable.lastReactedAt), desc(postTable.id));
    
    console.log("new query:");
    console.log(result2);
    */
    
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
        .limit(actualLimit)
        .where(
            showHidden === true
                ? whereUpdatedAt
                : and(whereUpdatedAt, eq(postTable.isHidden, false))
        );
    const posts: ExtendedPost[] = results.map((result) => {
        const metadata: PostMetadata =
            showHidden === true
                ? {
                    postSlugId: result.slugId,
                    isHidden: result.isHidden,
                    updatedAt: result.updatedAt,
                    lastReactedAt: result.lastReactedAt,
                    commentCount: result.commentCount,
                    authorName: toUnionUndefined(result.authorName),
                    authorImagePath: toUnionUndefined(result.authorImagePath)
                }
                : {
                    postSlugId: result.slugId,
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
            metadata: metadata,
            payload: payload,
        };
    });

    console.log(posts);

    return posts;
}
