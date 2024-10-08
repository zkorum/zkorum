// import { toEncodedCID } from "@/shared/common/cid.js";
// import { nowZeroMs } from "@/shared/common/util.js";
// import {
//     toUnionUndefined,
//     type ToxicityClassification,
// } from "@/shared/shared.js";
// import {
//     Presentation,
// } from "@docknetwork/crypto-wasm-ts";
// import type { HttpErrors } from "@fastify/sensible/lib/httpError.js";
// import {
//     and,
//     asc,
//     desc,
//     eq,
//     gt,
//     lt,
//     sql,
//     type TablesRelationalConfig,
// } from "drizzle-orm";
// import type { PgTransaction, QueryResultHKT } from "drizzle-orm/pg-core";
// import { type PostgresJsDatabase as PostgresDatabase } from "drizzle-orm/postgres-js";
// import {
//     generateRandomSlugId,
// } from "../crypto.js";
// import {
//     commentTable,
//     pollResponseTable,
//     pollTable,
//     postTable,
//     pseudonymTable,
// } from "../schema.js";
// import {
//     type CreateCommentPayload,
//     type ExtendedPostData,
//     type Post,
//     type PostComment,
//     type PostId,
//     type PostSlugId,
//     type PostUid,
//     type ResponseToPollPayload,
// } from "../shared/types/zod.js";
// import { log } from "@/app.js";
//
// interface CreatePostProps {
//     db: PostgresDatabase;
//     presentation: Presentation;
//     post: Post;
//     pseudonym: string;
//     postAs: PostAs;
// }
//
// interface SelectPersonaIdFromAttributesProps<
//     TQueryResult extends QueryResultHKT,
//     TFullSchema extends Record<string, unknown>,
//     TSchema extends TablesRelationalConfig,
// > {
//     db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
//     domain: string;
// }
//
// interface FetchFeedProps<
//     TQueryResult extends QueryResultHKT,
//     TFullSchema extends Record<string, unknown>,
//     TSchema extends TablesRelationalConfig,
// > {
//     db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
//     lastReactedAt: Date | undefined;
//     order: "more" | "recent";
//     limit?: number;
//     showHidden?: boolean;
// }
//
// interface RespondToPollProps {
//     db: PostgresDatabase;
//     presentation: Presentation;
//     response: ResponseToPollPayload;
//     pseudonym: string;
//     postAs: PostAs;
//     httpErrors: HttpErrors;
// }
//
// interface CreateCommentProps {
//     db: PostgresDatabase;
//     pseudonym: string;
//     postAs: PostAs;
//     presentation: Presentation;
//     payload: CreateCommentPayload;
//     httpErrors: HttpErrors;
//     nlpBaseUrl: string;
// }
//
// interface SelectOrInsertPseudonymProps<
//     TQueryResult extends QueryResultHKT,
//     TFullSchema extends Record<string, unknown>,
//     TSchema extends TablesRelationalConfig,
// > {
//     tx: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
//     pseudonym: string;
//     postAs: PostAs;
// }
//
// interface FetchPostByUidOrSlugIdProps<
//     TQueryResult extends QueryResultHKT,
//     TFullSchema extends Record<string, unknown>,
//     TSchema extends TablesRelationalConfig,
// > {
//     db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
//     postUidOrSlugId: PostUid | PostSlugId;
//     type: "slugId" | "postUid";
//     httpErrors: HttpErrors;
// }
//
// interface ModeratePostProps {
//     db: PostgresDatabase;
//     pollUid: PostUid;
// }
//
// interface ModerateCommentProps {
//     db: PostgresDatabase;
//     commentSlugId: PostSlugId;
// }
//
// interface PostAndId {
//     post: ExtendedPostData;
//     postId: PostId;
// }
//
// interface FetchPostByProps<
//     TQueryResult extends QueryResultHKT,
//     TFullSchema extends Record<string, unknown>,
//     TSchema extends TablesRelationalConfig,
// > {
//     db: PostgresDatabase | PgTransaction<TQueryResult, TFullSchema, TSchema>;
// }
//
// interface GetPostIdFromSlugIdProps {
//     db: PostgresDatabase;
//     slugId: PostSlugId;
//     httpErrors: HttpErrors;
// }
//
// function fetchPostBy({
//     db,
// }: FetchPostByProps<
//     QueryResultHKT,
//     Record<string, unknown>,
//     TablesRelationalConfig
// >) {
//     return db
//         .selectDistinct({
//             // id
//             id: postTable.id,
//             // poll payload
//             title: postTable.title,
//             body: postTable.body,
//             option1: pollTable.option1,
//             option1Response: pollTable.option1Response,
//             option2: pollTable.option2,
//             option2Response: pollTable.option2Response,
//             option3: pollTable.option3,
//             option3Response: pollTable.option3Response,
//             option4: pollTable.option4,
//             option4Response: pollTable.option4Response,
//             option5: pollTable.option5,
//             option5Response: pollTable.option5Response,
//             option6: pollTable.option6,
//             option6Response: pollTable.option6Response,
//             // post as
//             pseudonym: pseudonymTable.pseudonym,
//             domain: personaTable.domain,
//             // metadata
//             pollUid: postTable.timestampedPresentationCID,
//             slugId: postTable.slugId,
//             isHidden: postTable.isHidden,
//             updatedAt: postTable.updatedAt,
//             lastReactedAt: postTable.lastReactedAt,
//             commentCount: postTable.commentCount,
//         })
//         .from(postTable)
//         .innerJoin(pseudonymTable, eq(pseudonymTable.id, postTable.authorId))
//         .innerJoin(personaTable, eq(personaTable.id, pseudonymTable.personaId))
//         .leftJoin(pollTable, eq(postTable.id, pollTable.postId));
// }
//
// // No need to validate data, it has been done in the controller level
// export class Service {
//
//     static async selectPersonaIdFromAttributes({
//         db,
//         domain,
//     }: SelectPersonaIdFromAttributesProps<
//         QueryResultHKT,
//         Record<string, unknown>,
//         TablesRelationalConfig
//     >): Promise<number | undefined> {
//         const results = await db
//             .select({
//                 personaId: personaTable.id,
//             })
//             .from(personaTable)
//             .where(and(eq(personaTable.domain, domain)));
//         if (results.length === 0) {
//             return undefined;
//         } else {
//             return results[0].personaId;
//         }
//     }
//
//     // TODO actually try to select pseudonym first
//     static async selectOrInsertPseudonym({
//         tx,
//         postAs,
//         pseudonym,
//     }: SelectOrInsertPseudonymProps<
//         QueryResultHKT,
//         Record<string, unknown>,
//         TablesRelationalConfig
//     >): Promise<number> {
//         ////////////// PERSONA - POST AS ///////////
//         const resultSelectPseudonymId = await tx
//             .select({ id: pseudonymTable.id })
//             .from(pseudonymTable)
//             .where(eq(pseudonymTable.pseudonym, pseudonym));
//         if (resultSelectPseudonymId.length !== 0) {
//             return resultSelectPseudonymId[0].id;
//         }
//         let personaId: number | undefined = undefined;
//         // TODO: switch case depending on value of postAs.type - here we only do work for universities
//         const selectedPersonaId: number | undefined =
//             await Service.selectPersonaIdFromAttributes({
//                 db: tx,
//                 domain: postAs.domain,
//             });
//         if (selectedPersonaId === undefined) {
//             const insertedPersona = await tx
//                 .insert(personaTable)
//                 .values({
//                     domain: postAs.domain,
//                 })
//                 .returning({ insertedId: personaTable.id });
//             personaId = insertedPersona[0].insertedId;
//         } else {
//             personaId = selectedPersonaId;
//         }
//         const insertedAuthor = await tx
//             .insert(pseudonymTable)
//             .values({
//                 pseudonym: pseudonym,
//                 personaId: personaId, // TODO: maybe we could allow posting just as a member of ZKorum? Then this could be undefined
//             })
//             .returning({ insertedId: pseudonymTable.id });
//         return insertedAuthor[0].insertedId;
//         /////////////////////////////////////////////////////////////////////////////////////////
//     }
//
//     static async createPost({
//         db,
//         presentation,
//         post,
//         pseudonym,
//         postAs,
//     }: CreatePostProps): Promise<string> {
//         const presentationCID = await toEncodedCID(presentation);
//         const now = nowZeroMs();
//         const timestampedPresentation = {
//             timestamp: now.getTime(),
//             presentation: presentation,
//         }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
//         const timestampedPresentationCID = await toEncodedCID(
//             timestampedPresentation
//         );
//         await db.transaction(async (tx) => {
//             ////////////// PERSONA - POST AS ///////////
//             const authorId = await Service.selectOrInsertPseudonym({
//                 tx: tx,
//                 postAs: postAs,
//                 pseudonym: pseudonym,
//             });
//             /////////////////////////////////////////////////////////////////////////////////////////
//             const insertedPost = await tx
//                 .insert(postTable)
//                 .values({
//                     presentation: presentation.toJSON(),
//                     presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
//                     slugId: generateRandomSlugId(),
//                     timestampedPresentationCID: timestampedPresentationCID,
//                     title: post.data.title,
//                     body:
//                         post.data.body?.length === 0
//                             ? undefined
//                             : post.data.body, // we don't want to insert a string with length 0
//                     authorId: authorId,
//                     createdAt: now,
//                     updatedAt: now,
//                     lastReactedAt: now,
//                 })
//                 .returning({
//                     insertedId: postTable.id,
//                 });
//             if (post.data.poll !== undefined) {
//                 const optionalOptions = [
//                     post.data.poll.option3,
//                     post.data.poll.option4,
//                     post.data.poll.option5,
//                     post.data.poll.option6,
//                 ];
//                 const realOptionalOptions: string[] = optionalOptions.filter(
//                     (option) => option !== undefined && option !== ""
//                 ) as string[];
//                 await tx.insert(pollTable).values({
//                     postId: insertedPost[0].insertedId,
//                     option1: post.data.poll.option1,
//                     option2: post.data.poll.option2,
//                     option3:
//                         realOptionalOptions.length >= 1
//                             ? realOptionalOptions[0]
//                             : undefined,
//                     option4:
//                         realOptionalOptions.length >= 2
//                             ? realOptionalOptions[1]
//                             : undefined,
//                     option5:
//                         realOptionalOptions.length >= 3
//                             ? realOptionalOptions[2]
//                             : undefined,
//                     option6:
//                         realOptionalOptions.length >= 4
//                             ? realOptionalOptions[3]
//                             : undefined,
//                     createdAt: now,
//                     updatedAt: now,
//                 });
//             }
//         });
//         // TODO: broadcast timestampedPresentation to Nostr or custom libp2p node
//         return timestampedPresentationCID;
//     }
//
//     static async fetchFeed({
//         db,
//         lastReactedAt,
//         order,
//         limit,
//         showHidden,
//     }: FetchFeedProps<
//         QueryResultHKT,
//         Record<string, unknown>,
//         TablesRelationalConfig
//     >): Promise<ExtendedPostData[]> {
//         const defaultLimit = 30;
//         const actualLimit = limit === undefined ? defaultLimit : limit;
//         const whereUpdatedAt =
//             lastReactedAt === undefined
//                 ? undefined
//                 : order === "more"
//                     ? lt(postTable.lastReactedAt, lastReactedAt)
//                     : gt(postTable.lastReactedAt, lastReactedAt);
//         const results = await db
//             .selectDistinctOn([postTable.lastReactedAt, postTable.id], {
//                 // poll payload
//                 title: postTable.title,
//                 body: postTable.body,
//                 option1: pollTable.option1,
//                 option1Response: pollTable.option1Response,
//                 option2: pollTable.option2,
//                 option2Response: pollTable.option2Response,
//                 option3: pollTable.option3,
//                 option3Response: pollTable.option3Response,
//                 option4: pollTable.option4,
//                 option4Response: pollTable.option4Response,
//                 option5: pollTable.option5,
//                 option5Response: pollTable.option5Response,
//                 option6: pollTable.option6,
//                 option6Response: pollTable.option6Response,
//                 // post as
//                 pseudonym: pseudonymTable.pseudonym,
//                 domain: personaTable.domain,
//                 // metadata
//                 pollUid: postTable.timestampedPresentationCID,
//                 slugId: postTable.slugId,
//                 isHidden: postTable.isHidden,
//                 updatedAt: postTable.updatedAt,
//                 lastReactedAt: postTable.lastReactedAt,
//                 commentCount: postTable.commentCount,
//             })
//             .from(postTable)
//             .innerJoin(
//                 pseudonymTable,
//                 eq(pseudonymTable.id, postTable.authorId)
//             )
//             .innerJoin(
//                 personaTable,
//                 eq(personaTable.id, pseudonymTable.personaId)
//             )
//             .leftJoin(pollTable, eq(postTable.id, pollTable.postId))
//             .orderBy(desc(postTable.lastReactedAt), desc(postTable.id))
//             .limit(actualLimit)
//             .where(
//                 showHidden === true
//                     ? whereUpdatedAt
//                     : and(whereUpdatedAt, eq(postTable.isHidden, false))
//             );
//         const posts: ExtendedPostData[] = results.map((result) => {
//             const metadata =
//                 showHidden === true
//                     ? {
//                         uid: result.pollUid,
//                         slugId: result.slugId,
//                         isHidden: result.isHidden,
//                         updatedAt: result.updatedAt,
//                         lastReactedAt: result.lastReactedAt,
//                         commentCount: result.commentCount,
//                     }
//                     : {
//                         uid: result.pollUid,
//                         slugId: result.slugId,
//                         updatedAt: result.updatedAt,
//                         lastReactedAt: result.lastReactedAt,
//                         commentCount: result.commentCount,
//                     };
//             return {
//                 metadata: metadata,
//                 payload: {
//                     title: result.title,
//                     body: toUnionUndefined(result.body),
//                     poll:
//                         result.option1 !== null &&
//                             result.option2 !== null &&
//                             result.option1Response !== null &&
//                             result.option2Response !== null
//                             ? {
//                                 options: {
//                                     option1: result.option1,
//                                     option2: result.option2,
//                                     option3: toUnionUndefined(result.option3),
//                                     option4: toUnionUndefined(result.option4),
//                                     option5: toUnionUndefined(result.option5),
//                                     option6: toUnionUndefined(result.option6),
//                                 },
//                                 result: {
//                                     option1Response: result.option1Response,
//                                     option2Response: result.option2Response,
//                                     option3Response: toUnionUndefined(
//                                         result.option3Response
//                                     ),
//                                     option4Response: toUnionUndefined(
//                                         result.option4Response
//                                     ),
//                                     option5Response: toUnionUndefined(
//                                         result.option5Response
//                                     ),
//                                     option6Response: toUnionUndefined(
//                                         result.option6Response
//                                     ),
//                                 },
//                             }
//                             : undefined,
//                 },
//                 author: {
//                     pseudonym: result.pseudonym,
//                     domain: result.domain,
//                 },
//             };
//         });
//         return posts;
//     }
//
//     static async fetchPostByUidOrSlugId({
//         db,
//         postUidOrSlugId,
//         type,
//         httpErrors,
//     }: FetchPostByUidOrSlugIdProps<
//         QueryResultHKT,
//         Record<string, unknown>,
//         TablesRelationalConfig
//     >): Promise<PostAndId> {
//         const fetchPostQuery = fetchPostBy({ db });
//         const whereClause =
//             type === "postUid"
//                 ? eq(postTable.timestampedPresentationCID, postUidOrSlugId)
//                 : eq(postTable.slugId, postUidOrSlugId);
//         const results = await fetchPostQuery.where(whereClause);
//         if (results.length === 0) {
//             throw httpErrors.internalServerError(
//                 `There is no post for ${type} '${postUidOrSlugId}'`
//             );
//         }
//         if (results.length > 1) {
//             throw httpErrors.internalServerError(
//                 `There are more than one post for ${type} '${postUidOrSlugId}'`
//             );
//         }
//         const result = results[0];
//         const post: ExtendedPostData = {
//             metadata: {
//                 uid: result.pollUid,
//                 slugId: result.slugId,
//                 isHidden: result.isHidden,
//                 updatedAt: result.updatedAt,
//                 lastReactedAt: result.lastReactedAt,
//                 commentCount: result.commentCount,
//             },
//             payload: {
//                 title: result.title,
//                 body: toUnionUndefined(result.body),
//                 poll:
//                     result.option1 !== null &&
//                         result.option2 !== null &&
//                         result.option1Response !== null &&
//                         result.option2Response !== null
//                         ? {
//                             options: {
//                                 option1: result.option1,
//                                 option2: result.option2,
//                                 option3: toUnionUndefined(result.option3),
//                                 option4: toUnionUndefined(result.option4),
//                                 option5: toUnionUndefined(result.option5),
//                                 option6: toUnionUndefined(result.option6),
//                             },
//                             result: {
//                                 option1Response: result.option1Response,
//                                 option2Response: result.option2Response,
//                                 option3Response: toUnionUndefined(
//                                     result.option3Response
//                                 ),
//                                 option4Response: toUnionUndefined(
//                                     result.option4Response
//                                 ),
//                                 option5Response: toUnionUndefined(
//                                     result.option5Response
//                                 ),
//                                 option6Response: toUnionUndefined(
//                                     result.option6Response
//                                 ),
//                             },
//                         }
//                         : undefined,
//             },
//             author: {
//                 pseudonym: result.pseudonym,
//                 domain: result.domain,
//             },
//         };
//         const postId = result.id;
//         return { post, postId };
//     }
//
//     static async respondToPoll({
//         db,
//         presentation,
//         response,
//         pseudonym,
//         postAs,
//         httpErrors,
//     }: RespondToPollProps): Promise<ExtendedPostData> {
//         if (response.optionChosen > 6) {
//             throw httpErrors.badRequest(
//                 "Option chosen must be an integer between 1 and 6 included"
//             );
//         }
//         // check whether poll the user responds to actually exists
//         const results = await db
//             .selectDistinct({
//                 // poll metadata
//                 pollId: pollTable.id,
//                 // poll payload
//                 option3: pollTable.option3,
//                 option4: pollTable.option4,
//                 option5: pollTable.option5,
//                 option6: pollTable.option6,
//             })
//             .from(postTable)
//             .innerJoin(pollTable, eq(postTable.id, pollTable.postId)) // this may lead to 0 values in case the post has no associated poll
//             .where(eq(postTable.timestampedPresentationCID, response.postUid));
//         if (results.length === 0) {
//             throw httpErrors.notFound(
//                 "The post UID you tried to answer to does not exist or has no associated poll"
//             );
//         }
//         if (results.length > 1) {
//             throw httpErrors.internalServerError(
//                 "There are more than one poll corresponding to this UID"
//             );
//         }
//         const result = results[0];
//         if (response.optionChosen === 3 && result.option3 === null) {
//             throw httpErrors.badRequest(
//                 `Option 3 does not exist in poll '${response.postUid}'`
//             );
//         }
//         if (response.optionChosen === 4 && result.option4 === null) {
//             throw httpErrors.badRequest(
//                 `Option 4 does not exist in poll '${response.postUid}'`
//             );
//         }
//         if (response.optionChosen === 5 && result.option5 === null) {
//             throw httpErrors.badRequest(
//                 `Option 5 does not exist in poll '${response.postUid}'`
//             );
//         }
//         if (response.optionChosen === 6 && result.option6 === null) {
//             throw httpErrors.badRequest(
//                 `Option 6 does not exist in poll '${response.postUid}'`
//             );
//         }
//         const presentationCID = await toEncodedCID(presentation);
//         const now = nowZeroMs();
//         const timestampedPresentation = {
//             timestamp: now.getTime(),
//             presentation: presentation,
//         }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
//         const timestampedPresentationCID = await toEncodedCID(
//             timestampedPresentation
//         );
//         return await db.transaction(async (tx) => {
//             const authorId = await Service.selectOrInsertPseudonym({
//                 // we need to know if inserted or already existing - for below TODO
//                 tx: tx,
//                 postAs: postAs,
//                 pseudonym: pseudonym,
//             });
//             // in any case, insert the poll response in the dedicated table
//             await tx.insert(pollResponseTable).values({
//                 presentation: presentation.toJSON(),
//                 presentationCID: presentationCID,
//                 timestampedPresentationCID: timestampedPresentationCID,
//                 authorId: authorId,
//                 pollId: result.pollId,
//                 optionChosen: response.optionChosen,
//                 createdAt: now,
//                 updatedAt: now,
//             });
//             // TODO: check if poll has already been responded by this pseudonym, if yes, update it by getting the previous response, delete the old one and add the new one
//             // else, just add +1 to the chosen response
//             let optionChosenResponseColumnName:
//                 | "option1Response"
//                 | "option2Response"
//                 | "option3Response"
//                 | "option4Response"
//                 | "option5Response"
//                 | "option6Response";
//             let optionChosenResponseColumn:
//                 | typeof pollTable.option1Response
//                 | typeof pollTable.option2Response
//                 | typeof pollTable.option3Response
//                 | typeof pollTable.option4Response
//                 | typeof pollTable.option5Response
//                 | typeof pollTable.option6Response;
//             switch (
//             response.optionChosen // TODO Refactor by making it typesafe by default - this stinks
//             ) {
//                 case 1:
//                     optionChosenResponseColumnName = "option1Response";
//                     optionChosenResponseColumn = pollTable.option1Response;
//                     break;
//                 case 2:
//                     optionChosenResponseColumnName = "option2Response";
//                     optionChosenResponseColumn = pollTable.option2Response;
//                     break;
//                 case 3:
//                     optionChosenResponseColumnName = "option3Response";
//                     optionChosenResponseColumn = pollTable.option3Response;
//                     break;
//                 case 4:
//                     optionChosenResponseColumnName = "option4Response";
//                     optionChosenResponseColumn = pollTable.option4Response;
//                     break;
//                 case 5:
//                     optionChosenResponseColumnName = "option5Response";
//                     optionChosenResponseColumn = pollTable.option5Response;
//                     break;
//                 case 6:
//                     optionChosenResponseColumnName = "option6Response";
//                     optionChosenResponseColumn = pollTable.option6Response;
//                     break;
//                 default:
//                     throw httpErrors.badRequest(
//                         "Option chosen must be an integer between 1 and 6 included"
//                     );
//             }
//             await tx
//                 .update(pollTable)
//                 .set({
//                     [optionChosenResponseColumnName]: sql`coalesce(${optionChosenResponseColumn}, 0) + 1`,
//                     updatedAt: now,
//                 })
//                 .where(eq(pollTable.id, result.pollId));
//             await tx
//                 .update(postTable)
//                 .set({
//                     lastReactedAt: now,
//                 })
//                 .where(
//                     eq(postTable.timestampedPresentationCID, response.postUid)
//                 );
//             const { post } = await Service.fetchPostByUidOrSlugId({
//                 db,
//                 postUidOrSlugId: response.postUid,
//                 type: "postUid",
//                 httpErrors,
//             });
//             return post;
//         });
//     }
//
//     static async hidePost({ db, pollUid }: ModeratePostProps): Promise<void> {
//         await db
//             .update(postTable)
//             .set({
//                 isHidden: true,
//             })
//             .where(eq(postTable.timestampedPresentationCID, pollUid));
//     }
//
//     static async unhidePost({ db, pollUid }: ModeratePostProps): Promise<void> {
//         await db
//             .update(postTable)
//             .set({
//                 isHidden: false,
//             })
//             .where(eq(postTable.timestampedPresentationCID, pollUid));
//     }
//
//     static async hideComment({
//         db,
//         commentSlugId,
//     }: ModerateCommentProps): Promise<void> {
//         await db
//             .update(commentTable)
//             .set({
//                 isHidden: true,
//             })
//             .where(eq(commentTable.slugId, commentSlugId));
//     }
//
//     static async unhideComment({
//         db,
//         commentSlugId,
//     }: ModerateCommentProps): Promise<void> {
//         await db
//             .update(commentTable)
//             .set({
//                 isHidden: false,
//             })
//             .where(eq(commentTable.slugId, commentSlugId));
//     }
//
//     static async createComment({
//         db,
//         pseudonym,
//         postAs,
//         presentation,
//         payload,
//         httpErrors,
//         nlpBaseUrl,
//     }: CreateCommentProps): Promise<PostUid> {
//         // Check whether post the user responds to actually exists
//         const results = await db
//             .select({
//                 pollId: postTable.id,
//             })
//             .from(postTable)
//             .where(eq(postTable.timestampedPresentationCID, payload.postUid));
//         if (results.length === 0) {
//             throw httpErrors.notFound(
//                 "The post UID you tried to answer to does not exist"
//             );
//         }
//         if (results.length > 1) {
//             throw httpErrors.internalServerError(
//                 "There are more than one post corresponding to this UID"
//             );
//         }
//         const result = results[0];
//         const presentationCID = await toEncodedCID(presentation);
//         const now = nowZeroMs();
//         const timestampedPresentation = {
//             timestamp: now.getTime(),
//             presentation: presentation,
//         }; // TODO: use a TimeStamp Authority Server to get this data from the presentation's CID, instead of creating it ourselves
//         const timestampedPresentationCID = await toEncodedCID(
//             timestampedPresentation
//         );
//         let toxicityResp: Response | undefined = undefined;
//         try {
//             toxicityResp = await fetch(`${nlpBaseUrl}/detoxify`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     speech: payload.content,
//                 }),
//             });
//         } catch (e) {
//             log.warn(`Interaction with nlp service failed: '${e}'`)
//         }
//         let detoxifyResult: ToxicityClassification | undefined = undefined;
//         if (toxicityResp === undefined || toxicityResp?.status < 200 || toxicityResp?.status > 299) {
//             log.warn(`Interaction with nlp service failed: '${toxicityResp?.status} - ${toxicityResp?.statusText}'`)
//             // throw httpErrors.internalServerError(
//             //     `Interaction with nlp service failed: '${toxicityResp.status} - ${toxicityResp.statusText}'`
//             // );
//         } else {
//             detoxifyResult =
//                 (await toxicityResp.json()) as ToxicityClassification;
//         }
//         await db.transaction(async (tx) => {
//             const authorId = await Service.selectOrInsertPseudonym({
//                 tx: tx,
//                 postAs: postAs,
//                 pseudonym: pseudonym,
//             });
//             await tx.insert(commentTable).values({
//                 presentation: presentation.toJSON(),
//                 presentationCID: presentationCID, // Check for replay attack (same presentation) - done by the database *unique* rule
//                 timestampedPresentationCID: timestampedPresentationCID,
//                 slugId: generateRandomSlugId(),
//                 authorId: authorId,
//                 toxicity: detoxifyResult !== undefined ? detoxifyResult.toxicity : 0,
//                 severeToxicity: detoxifyResult !== undefined ? detoxifyResult.severe_toxicity : 0,
//                 obscene: detoxifyResult !== undefined ? detoxifyResult.obscene : 0,
//                 identityAttack: detoxifyResult !== undefined ? detoxifyResult.identity_attack : 0,
//                 insult: detoxifyResult !== undefined ? detoxifyResult.insult : 0,
//                 threat: detoxifyResult !== undefined ? detoxifyResult.threat : 0,
//                 sexualExplicit: detoxifyResult !== undefined ? detoxifyResult.sexual_explicit : 0,
//                 content: payload.content,
//                 postId: result.pollId,
//                 createdAt: now,
//                 updatedAt: now,
//             });
//             await tx
//                 .update(postTable)
//                 .set({
//                     lastReactedAt: now,
//                     commentCount: sql`coalesce(${postTable.commentCount}, 0) + 1`,
//                 })
//                 .where(eq(postTable.id, result.pollId));
//         });
//         return timestampedPresentationCID;
//     }
//
//     static async getPostIdFromSlugId({
//         db,
//         slugId,
//         httpErrors,
//     }: GetPostIdFromSlugIdProps): Promise<PostId> {
//         const results = await db
//             .select({ id: postTable.id })
//             .from(postTable)
//             .where(eq(postTable.slugId, slugId));
//         if (results.length === 0) {
//             throw httpErrors.notFound(
//                 `The post slug id ${slugId} does not exist`
//             );
//         }
//         if (results.length > 1) {
//             throw httpErrors.internalServerError(
//                 `There are more than one post corresponding to the slug id ${slugId}`
//             );
//         }
//         return results[0].id;
//     }
// }
