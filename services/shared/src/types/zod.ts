import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import {
    MAX_LENGTH_TITLE,
    MAX_LENGTH_OPTION,
} from "../shared.js";
import validator from 'validator';

export const zodPhoneNumber = z
    .string()
    .describe("Phone number")
    .refine(
        (val: string) => {
            return validator.isMobilePhone(val);
        },
        {
            message: "Please use valid mobile phone number",
        }
    );
// WARNING: CHANGE THIS AT THE SAME TIME AS THE PGENUM IN SCHEMA.TS
export const zodPhoneCountryCode = z.enum([
    "376", "971", "93", "1268", "1264", "355", "374", "244", "672", "54", "1684", "43", "297", "358", "994", "387", "1246",
    "880", "32", "226", "359", "973", "257", "229", "590", "1441", "673", "591", "5997", "55", "1242", "975", "47", "267", "375",
    "501", "1", "243", "236", "242", "41", "225", "682", "56", "237", "86", "57", "506", "53", "238", "5999", "61", "357",
    "420", "49", "253", "45", "1767", "1809", "1829", "1849", "213", "593", "372", "20", "212", "291", "34", "251", "679",
    "500", "691", "298", "33", "241", "1473", "995", "594", "233", "350", "299", "220", "224", "240", "30",
    "502", "1671", "245", "592", "852", "504", "385", "509", "36", "62", "353", "972", "91", "246", "964",
    "98", "354", "39", "44", "1876", "962", "81", "254", "996", "855", "686", "269", "1869", "850", "82", "965", "1345", "76",
    "77", "856", "961", "1758", "423", "94", "231", "266", "370", "352", "371", "218", "377", "373", "382", "261",
    "692", "389", "223", "95", "976", "853", "1670", "596", "222", "1664", "356", "230", "960", "265", "52", "60", "258", "264",
    "687", "227", "234", "505", "31", "977", "674", "683", "64", "968", "507", "51", "689", "675", "63", "92",
    "48", "508", "1787", "1939", "970", "351", "680", "595", "974", "262", "40", "381", "7", "250", "966", "677", "248",
    "249", "46", "65", "290", "386", "4779", "421", "232", "378", "221", "252", "597", "211", "239", "503", "1721", "963",
    "268", "1649", "235", "228", "66", "992", "690", "670", "993", "216", "676", "90", "1868", "688", "886", "255",
    "380", "256", "598", "998", "379", "1784", "58", "1284", "1340", "84", "678", "681", "685", "383",
    "967", "27", "260", "263"
]);
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
export const zodPostDataWithResult = z
    .object({
        title: zodPostTitle,
        body: zodPostBody,
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
export const zodCommentContent = z.string().min(1); // Cannot specify the max length here due to the HTML tags
export const zodCommentItem = z.object({
    commentSlugId: zodSlugId,
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
export const zodVotingOption = z.enum(["like", "dislike"]);
export const zodVotingAction = z.enum(["like", "dislike", "cancel"]);

export type Device = z.infer<typeof zodDevice>;
export type Devices = z.infer<typeof zodDevices>;
export type ExtendedPost = z.infer<typeof zodExtendedPostData>;
export type PostMetadata = z.infer<typeof zodPostMetadata>;
export type ExtendedPostPayload = z.infer<typeof zodPostDataWithResult>
export type PollOptionWithResult = z.infer<typeof zodPollOptionWithResult>
export type CommentContent = z.infer<typeof zodCommentContent>;
export type CommentItem = z.infer<typeof zodCommentItem>;
export type SlugId = z.infer<typeof zodSlugId>;
export type VotingOption = z.infer<typeof zodVotingOption>;
export type VotingAction = z.infer<typeof zodVotingAction>;
export type PhoneCountryCode = z.infer<typeof zodPhoneCountryCode>;
