/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import {
    zodExtendedPostData,
    zodCode,
    zodUserId,
    zodSlugId,
    zodCommentItem,
    zodPollOptionTitle,
    zodPostTitle,
    zodPostBody,
    zodVotingOption,
    zodVotingAction,
    zodUserName,
    zodPhoneNumber,
} from "./zod.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Dto {
    static authenticateCheckLoginStatus = z.object({}).strict();
    static authenticateRequestBody = z
        .object({
            phoneNumber: zodPhoneNumber,
            defaultCallingCode: z.string(),
            isRequestingNewCode: z.boolean(),
        })
        .strict();
    static verifyOtpReqBody = z.object({
        code: zodCode,
    });
    static authenticateResponse = z
        .object({
            codeExpiry: z.date(),
            nextCodeSoonestTime: z.date(),
        })
        .strict();
    static verifyOtp200 = z.discriminatedUnion("success", [
        z
            .object({
                success: z.literal(true),
                userId: zodUserId,
                sessionExpiry: z.date(),
            })
            .strict(),
        z
            .object({
                success: z.literal(false),
                reason: z.enum([
                    "expired_code",
                    "wrong_guess",
                    "too_many_wrong_guess",
                ]),
            })
            .strict(),
    ]);
    // WARNING when changing auth 409 - also change expected type in frontend manually!
    static auth409 = z
        .object({
            reason: z.literal("already_logged_in"),
            userId: zodUserId,
            sessionExpiry: z.date(),
            status: z.number(),
            expose: z.boolean()
        }).strict();
    static isLoggedInResponse = z.discriminatedUnion("isLoggedIn", [
        z.object({ isLoggedIn: z.literal(true), userId: zodUserId }).strict(),
        z
            .object({
                isLoggedIn: z.literal(false),
            })
            .strict(),
    ]);
    static getDeviceStatusResp = z
        .object({
            userId: zodUserId,
            isLoggedIn: z.boolean(),
            sessionExpiry: z.date(),
        })
        .strict()
        .optional();
    static fetchFeedRequest = z
        .object({
            showHidden: z.boolean(),
            lastSlugId: z.string().optional(),
        })
        .strict();
    static fetchFeedResponse = z.object({
        postDataList: z.array(zodExtendedPostData),
        reachedEndOfFeed: z.boolean()
    }).strict();
    static postFetchRequest = z.object({
        postSlugId: zodSlugId, // z.object() does not exist :(
    }).strict();
    static postFetch200 = z.object({
        post: zodExtendedPostData, // z.object() does not exist :(
        comments: z.array(zodCommentItem),
    }).strict();
    static fetchCommentFeedRequest = z.object({
        postSlugId: zodSlugId, // z.object() does not exist :(
        createdAt: z.string().datetime().optional(),
    }).strict();
    static fetchCommentFeedResponse = z.array(zodCommentItem);
    static createNewPostRequest = z.object({
        postTitle: zodPostTitle,
        postBody: zodPostBody,
        pollingOptionList: zodPollOptionTitle.array().optional()
    }).strict();
    static createNewPostResponse = z.object({ postSlugId: z.string() }).strict();
    static fetchPostBySlugIdRequest = z.object({
        postSlugId: zodSlugId,
    }).strict();
    static fetchPostBySlugIdResponse = z.object({
        postData: zodExtendedPostData
    }).strict();
    static createCommentRequest = z.object({
        postSlugId: z.string(),
        commentBody: z.string()
    }).strict();
    static createCommentResponse = z.object({ commentSlugId: z.string() }).strict();
    static submitPollResponseRequest = z.object({
        voteOptionChoice: z.number(),
        postSlugId: z.string()
    }).strict();
    static fetchUserPollResponseRequest = z.array(z.string());
    static fetchUserPollResponseResponse = z.array(z.object({
        postSlugId: z.string(),
        optionChosen: z.number().gte(0)
    }).strict());
    static fetchUserVotesForPostSlugIdRequest = z.object({
        postSlugId: z.string()
    }).strict();
    static fetchUserVotesForPostSlugIdResponse = z.array(z.object({
        commentSlugId: z.string(),
        votingAction: zodVotingOption
    }).strict());
    static castVoteForCommentRequest = z.object({
        commentSlugId: z.string(),
        chosenOption: zodVotingAction
    }).strict();
    static fetchUserProfileResponse = z.object({
        commentCount: z.number().gte(0),
        postCount: z.number().gte(0),
        createdAt: z.date(),
        userName: zodUserName,
        userPostList: z.array(zodExtendedPostData),
    }).strict();
}

export type AuthenticateRequestBody = z.infer<
    typeof Dto.authenticateRequestBody
>;
export type VerifyOtp200 = z.infer<typeof Dto.verifyOtp200>;
export type VerifyOtpReqBody = z.infer<typeof Dto.verifyOtpReqBody>;
export type Auth409 = z.infer<typeof Dto.auth409>;
export type IsLoggedInResponse = z.infer<typeof Dto.isLoggedInResponse>;
export type GetDeviceStatusResp = z.infer<typeof Dto.getDeviceStatusResp>;
export type PostFetch200 = z.infer<typeof Dto.postFetch200>;
export type CreateNewPostResponse = z.infer<typeof Dto.createNewPostResponse>;
export type FetchPostBySlugIdResponse = z.infer<
    typeof Dto.fetchPostBySlugIdResponse
>;
export type CreateCommentResponse = z.infer<typeof Dto.createCommentResponse>;
export type FetchUserPollResponseResponse = z.infer<typeof Dto.fetchUserPollResponseResponse>;
export type FetchUserVotesForPostSlugIdResponseResponse = z.infer<typeof Dto.fetchUserVotesForPostSlugIdResponse>;
export type FetchCommentFeedResponse = z.infer<typeof Dto.fetchCommentFeedResponse>;
export type FetchFeedResponse = z.infer<typeof Dto.fetchFeedResponse>;
export type FetchUserProfileResponse = z.infer<typeof Dto.fetchUserProfileResponse>;