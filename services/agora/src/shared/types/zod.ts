/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import {
    MAX_LENGTH_TITLE,
    MAX_LENGTH_OPTION,
    MAX_LENGTH_COMMENT,
} from "../shared.js";

export const zodEmail = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address");
export const zodDidKey = z
    .string()
    .describe("Decentralized Identifier with did:key method")
    .max(1000)
    .refine(
        (val: string) => {
            return validateDidKey(val);
        },
        {
            message: "Please use a base58-encoded DID formatted `did:key:z...`",
        }
    );
export const zodDidWeb = z
    .string()
    .describe("Decentralized Identifier with did:web method")
    .max(1000)
    .refine(
        (val: string) => {
            return validateDidWeb(val);
        },
        {
            message: "Please use a valid DID formatted `did:web:...`",
        }
    );
export const zodCode = z.coerce.number().min(0).max(999999);
export const zodDigit = z.coerce.number().int().nonnegative().lte(9);
export const zodUserId = z.string().uuid().nonempty();
export const zodDevice = z
    .object({
        didWrite: zodDidKey,
        userAgent: z.string(),
    })
    .strict();
export const zodDevices = z.array(zodDevice); // list of didWrite of all the devices belonging to a user
export const zodPostTitle = z.string().max(MAX_LENGTH_TITLE).nonempty();
export const zodPostBody = z.string(); // Cannot specify length due to HTML tags
export const zodPollOptionTitle = z.string().max(MAX_LENGTH_OPTION).nonempty();
export const zodPollOptionWithResult = z.object({
    index: z.number().int().nonnegative(),
    option: zodPollOptionTitle,
    numResponses: z.number().int().nonnegative(),
    isChosen: z.boolean()
}).strict();
export const zodPostDataWithResult = z
    .object({
        title: zodPostTitle,
        body: zodPostBody.optional(),
        poll: z.array(zodPollOptionWithResult).optional()
    })
    .strict();
export const zodSlugId = z.string().max(10);
export const zodCommentCount = z.number().int().nonnegative();
export const zodPostMetadata = z
    .object({
        postSlugId: zodSlugId,
        isHidden: z.boolean().optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
        lastReactedAt: z.date(),
        commentCount: zodCommentCount,
        authorName: z.string().optional(),
        authorImagePath: z.string().url({ message: "Invalid url" }).optional() // TODO: check if it accepts path segments for local dev
    })
    .strict();
export const zodCommentContent = z.string().nonempty().max(MAX_LENGTH_COMMENT);
export const zodComment = z.object({
    commentSlugId: zodSlugId,
    isHidden: z.boolean().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    comment: zodCommentContent,
    numLikes: z.number().int().nonnegative(),
    numDislikes: z.number().int().nonnegative(),
    optionChosen: z.enum(["like", "dislike"]).optional()
}).strict();
export const zodComment2 = z.object({
    commentSlugId: zodSlugId,
    isHidden: z.boolean().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    comment: zodCommentContent,
    numLikes: z.number().int().nonnegative(),
    numDislikes: z.number().int().nonnegative()
}).strict();
export const zodExtendedPostData = z
    .object({
        metadata: zodPostMetadata,
        payload: zodPostDataWithResult,
    })
    .strict();

export type Email = z.infer<typeof zodEmail>;
export type Device = z.infer<typeof zodDevice>;
export type Devices = z.infer<typeof zodDevices>;
export type ExtendedPost = z.infer<typeof zodExtendedPostData>;
export type PostMetadata = z.infer<typeof zodPostMetadata>;
export type ExtendedPostPayload = z.infer<typeof zodPostDataWithResult>
export type PollOptionWithResult = z.infer<typeof zodPollOptionWithResult>
export type PostComment = z.infer<typeof zodComment>;
export type PostComment2 = z.infer<typeof zodComment>;
export type CommentContent = z.infer<typeof zodCommentContent>;
export type SlugId = z.infer<typeof zodSlugId>;
export type CommentItem = z.infer<typeof zodComment2>;