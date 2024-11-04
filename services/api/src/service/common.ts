import { postContentTable, pollTable, pollResponseContentTable, postTable, organisationTable, userTable, pollResponseTable } from "@/schema.js";
import { toUnionUndefined } from "@/shared/shared.js";
import type { PostMetadata, ExtendedPostPayload, PollOptionWithResult, ExtendedPost } from "@/shared/types/zod.js";
import type { HttpErrors } from "@fastify/sensible";
import { eq, and, desc, SQL } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import sanitizeHtml from "sanitize-html";

export function useCommonPost() {

    interface FetchPostItemsProps {
        db: PostgresJsDatabase;
        showHidden: boolean;
        limit: number;
        where: SQL | undefined;
        enableCompactBody: boolean;
    }

    async function fetchPostItems({
        db, showHidden, limit, where, enableCompactBody
    }: FetchPostItemsProps) {

        const postItems = await db
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
            .innerJoin(
                postContentTable,
                eq(postContentTable.id, postTable.currentContentId)
            )
            .innerJoin(
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
            .limit(limit)
            .where(where);

        const posts: ExtendedPost[] = postItems.map((postItem) => {

            if (enableCompactBody && postItem.body != null) {
                postItem.body = sanitizeHtml(postItem.body, {
                    allowedTags: ["b", "i", "strike", "u"],
                    allowedAttributes: {},
                    textFilter: function (text) { // , tagName
                        return text + " ";
                    }
                });
            }

            const metadata: PostMetadata = showHidden
                ? {
                    postSlugId: postItem.slugId,
                    isHidden: postItem.isHidden,
                    createdAt: postItem.createdAt,
                    updatedAt: postItem.updatedAt,
                    lastReactedAt: postItem.lastReactedAt,
                    commentCount: postItem.commentCount,
                    authorName: toUnionUndefined(postItem.authorName),
                    authorImagePath: toUnionUndefined(postItem.authorImagePath)
                }
                : {
                    postSlugId: postItem.slugId,
                    createdAt: postItem.createdAt,
                    updatedAt: postItem.updatedAt,
                    lastReactedAt: postItem.lastReactedAt,
                    commentCount: postItem.commentCount,
                    authorName: toUnionUndefined(postItem.authorName),
                    authorImagePath: toUnionUndefined(postItem.authorImagePath)
                };

            let payload: ExtendedPostPayload;
            if (postItem.option1 !== null && postItem.option2 !== null && postItem.option1Response !== null && postItem.option2Response !== null) { // hasPoll
                const pollList: PollOptionWithResult[] = [{
                    index: 1,
                    option: postItem.option1,
                    numResponses: postItem.option1Response,
                },
                {
                    index: 2,
                    option: postItem.option2,
                    numResponses: postItem.option2Response,
                }];
                if (postItem.option3 !== null) {
                    pollList.push({
                        index: 3,
                        option: postItem.option3,
                        numResponses: postItem.option3Response ?? 0,
                    });
                }
                if (postItem.option4 !== null) {
                    pollList.push({
                        index: 4,
                        option: postItem.option4,
                        numResponses: postItem.option4Response ?? 0,
                    });
                }
                if (postItem.option5 !== null) {
                    pollList.push({
                        index: 5,
                        option: postItem.option5,
                        numResponses: postItem.option5Response ?? 0,
                    });
                }
                if (postItem.option6 !== null) {
                    pollList.push({
                        index: 6,
                        option: postItem.option6,
                        numResponses: postItem.option6Response ?? 0,
                    });
                }
                console.log(pollList);
                payload = {
                    title: postItem.title, // Typescript inference limitation
                    body: toUnionUndefined(postItem.body),
                    poll: pollList,
                };
            } else {
                payload = {
                    title: postItem.title,
                    body: toUnionUndefined(postItem.body),
                };
            }
            return {
                metadata: metadata,
                payload: payload,
            };
        });

        return posts;

    }

    interface IdAndContentId {
        id: number;
        contentId: number | null;
    }

    interface GetPostAndContentIdFromSlugIdProps {
        db: PostgresJsDatabase;
        postSlugId: string;
        httpErrors: HttpErrors;
    }

    async function getPostAndContentIdFromSlugId(
        { db,
            postSlugId,
            httpErrors }: GetPostAndContentIdFromSlugIdProps): Promise<IdAndContentId> {
        const postTableResponse = await db
            .select({
                id: postTable.id,
                currentContentId: postTable.currentContentId,
            })
            .from(postTable)
            .where(eq(postTable.slugId, postSlugId));

        if (postTableResponse.length != 1) {
            throw httpErrors.notFound("Post slugId does not exist")
        }

        return { contentId: postTableResponse[0].currentContentId, id: postTableResponse[0].id };
    }

    return { fetchPostItems, getPostAndContentIdFromSlugId };
}
