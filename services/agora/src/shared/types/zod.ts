/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import {
    MAX_LENGTH_TITLE,
    MAX_LENGTH_OPTION,
    MIN_LENGTH_USERNAME,
    MAX_LENGTH_USERNAME,
} from "../shared.js";
import { isValidPhoneNumber } from "libphonenumber-js";

export const zodPhoneNumber = z
    .string()
    .describe("Phone number")
    .refine(
        (val: string) => {
            return isValidPhoneNumber(val);
        },
        {
            message: "Please use valid mobile phone number",
        },
    );
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
        },
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
        },
    );
export const zodCode = z.coerce.number().min(0).max(999999);
export const zodDigit = z.coerce.number().int().nonnegative().lte(9);
export const zodUserId = z.string().uuid().min(1);
export const zodDevice = z
    .object({
        didWrite: zodDidKey,
        userAgent: z.string(),
    })
    .strict();
export const zodDevices = z.array(zodDevice); // list of didWrite of all the devices belonging to a user
export const zodPostTitle = z.string().max(MAX_LENGTH_TITLE).min(1);
export const zodPostBody = z.string().optional(); // Cannot specify length due to HTML tags
export const zodPollOptionTitle = z.string().max(MAX_LENGTH_OPTION).min(1);
export const zodPollOptionWithResult = z.object({
    optionNumber: z.number().int().min(1).max(6),
    optionTitle: zodPollOptionTitle,
    numResponses: z.number().int().nonnegative(),
}).strict();
export const zodPollList = z.array(zodPollOptionWithResult).optional();
export const zodPostDataWithResult = z
    .object({
        title: zodPostTitle,
        body: zodPostBody,
        poll: zodPollList
    })
    .strict();
export const zodPollResponse = z.object({
    postSlugId: z.string(),
    optionChosen: z.number().gte(0)
}).strict();
export const zodSlugId = z.string().max(10);
export const zodCommentCount = z.number().int().nonnegative();
export const zodUserName = z.string().max(MAX_LENGTH_USERNAME).min(MIN_LENGTH_USERNAME);
export const zodPostMetadata = z
    .object({
        postSlugId: zodSlugId,
        isHidden: z.boolean().optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
        lastReactedAt: z.date(),
        commentCount: zodCommentCount,
        authorUserName: zodUserName,
        authorImagePath: z.string().url({ message: "Invalid url" }).optional() // TODO: check if it accepts path segments for local dev
    })
    .strict();
export const zodCommentContent = z.string().min(1); // Cannot specify the max length here due to the HTML tags
export const zodCommentItem = z.object({
    commentSlugId: zodSlugId,
    createdAt: z.date(),
    updatedAt: z.date(),
    comment: zodCommentContent,
    numLikes: z.number().int().nonnegative(),
    numDislikes: z.number().int().nonnegative(),
    userName: zodUserName,
}).strict();
export const zodExtendedPostData = z
    .object({
        metadata: zodPostMetadata,
        payload: zodPostDataWithResult
    })
    .strict();
export const zodVotingOption = z.enum(["like", "dislike"]);
export const zodVotingAction = z.enum(["like", "dislike", "cancel"]);
export const zodLanguageNameOption = z.enum(["English", "Spanish", "Chinese"]);
export interface LanguageObject {
    name: string;
    lang: string;
}
export const languageObjectList: LanguageObject[] = [
    { lang: "en", name: "English" },
    { lang: "es", name: "Spanish" },
    { lang: "fr", name: "French" },
    { lang: "zh", name: "Chinese" },
];

export type Device = z.infer<typeof zodDevice>;
export type Devices = z.infer<typeof zodDevices>;
export type ExtendedPost = z.infer<typeof zodExtendedPostData>;
export type PostMetadata = z.infer<typeof zodPostMetadata>;
export type ExtendedPostPayload = z.infer<typeof zodPostDataWithResult>;
export type PollOptionWithResult = z.infer<typeof zodPollOptionWithResult>;
export type CommentContent = z.infer<typeof zodCommentContent>;
export type CommentItem = z.infer<typeof zodCommentItem>;
export type SlugId = z.infer<typeof zodSlugId>;
export type VotingOption = z.infer<typeof zodVotingOption>;
export type VotingAction = z.infer<typeof zodVotingAction>;
export type PollList = z.infer<typeof zodPollList>;
