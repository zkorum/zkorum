/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import {
    zodResponseToPollPayload,
    zodauthorizedEmail,
    zodblindedCredential,
    zodcode,
    zodemail,
    zodemailCredential,
    zodemailCredentialsPerEmail,
    zodExtendedPostData,
    zodPost,
    zodPostUid,
    zodsecretCredentialRequest,
    zodsecretCredentialType,
    zodsecretCredentialsPerType,
    zoduserId,
    zodSlugId,
    zodComment,
    zodCommentContent,
} from "./zod.js";

export class Dto {
    static authenticateRequestBody = z
        .object({
            email: zodauthorizedEmail,
            isRequestingNewCode: z.boolean(),
        })
        .strict();
    static verifyOtpReqBody = z.object({
        code: zodcode,
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
                userId: zoduserId,
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
    static auth409 =
        z.object({
            reason: z.literal("already_logged_in"),
            userId: zoduserId,
            sessionExpiry: z.date(),
        });
    static recoverAccountReq = z.object({
        encryptedSymmKey: z.string(),
        timeboundSecretCredentialRequest: zodsecretCredentialRequest,
        unboundSecretCredentialRequest: zodsecretCredentialRequest,
    });
    static recoverAccountResp = z.object({
        userId: zoduserId,
        sessionExpiry: z.date(),
        emailCredentialsPerEmail: zodemailCredentialsPerEmail,
        secretCredentialsPerType: zodsecretCredentialsPerType,
    });
    static isLoggedInResponse = z.discriminatedUnion("isLoggedIn", [
        z.object({ isLoggedIn: z.literal(true), userId: zoduserId }).strict(),
        z
            .object({
                isLoggedIn: z.literal(false),
            })
            .strict(),
    ]);
    static getDeviceStatusResp = z.object({
        userId: zoduserId,
        isLoggedIn: z.boolean(),
        sessionExpiry: z.date(),
    }).strict().optional();
    static userCredentials = z
        .object({
            emailCredentialsPerEmail: zodemailCredentialsPerEmail,
            secretCredentialsPerType: zodsecretCredentialsPerType,
        })
        .strict();
    static emailSecretCredentials = z
        .object({
            emailCredentialsPerEmail: zodemailCredentialsPerEmail,
            secretCredentialsPerType: zodsecretCredentialsPerType,
        })
        .strict();
    static createPostRequest = z.object({
        post: zodPost,
        pres: z.unknown(), // z.object() does not exist :(
    });
    static respondPollRequest = z.object({
        responseToPoll: zodResponseToPollPayload,
        pres: z.unknown(), // z.object() does not exist :(
    });
    static fetchFeedRequest = z
        .object({
            showHidden: z.boolean(),
            lastReactedAt: z.string().datetime().optional(),
        })
        .strict();
    static fetchFeed200 = z.array(zodExtendedPostData);
    static pollRespond200 = zodExtendedPostData;
    static moderatePostRequest = z.object({
        pollUid: zodPostUid,
    });
    static moderateCommentRequest = z.object({
        commentSlugId: zodSlugId,
        postSlugId: zodSlugId,
    });
    static renewSecretCredential = z.object({
        secretCredentialRequest: zodsecretCredentialRequest,
        type: zodsecretCredentialType,
    });
    static renewSecretCredential200 = z.object({
        signedBlindedCredential: zodblindedCredential,
    });
    static renewEmailCredential = z.object({
        email: zodemail,
    });
    static renewEmailCredential200 = z.object({
        emailCredential: zodemailCredential,
    });
    static commentRequest = z.object({
        postUid: zodPostUid,
        content: zodCommentContent
    });
    static postFetchRequest = z.object({
        postSlugId: zodSlugId, // z.object() does not exist :(
    });
    static postFetch200 = z.object({
        post: zodExtendedPostData, // z.object() does not exist :(
        comments: z.array(zodComment),
    });
    static commentFetchFeedRequest = z.object({
        postSlugId: zodSlugId, // z.object() does not exist :(
        updatedAt: z.string().datetime().optional(),
    });
    static commentFetchFeed200 = z.object({ comments: z.array(zodComment) });
}
export type AuthenticateRequestBody = z.infer<
    typeof Dto.authenticateRequestBody
>;
export type VerifyOtp200 = z.infer<typeof Dto.verifyOtp200>;
export type VerifyOtpReqBody = z.infer<typeof Dto.verifyOtpReqBody>;
export type Auth409 = z.infer<typeof Dto.auth409>;
export type IsLoggedInResponse = z.infer<typeof Dto.isLoggedInResponse>;
export type GetDeviceStatusResp = z.infer<typeof Dto.getDeviceStatusResp>;
export type UserCredentials = z.infer<typeof Dto.userCredentials>;
export type EmailSecretCredentials = z.infer<typeof Dto.emailSecretCredentials>;
export type PostFetch200 = z.infer<typeof Dto.postFetch200>;
export type CreatePostRequest = z.infer<typeof Dto.createPostRequest>;
export type RecoverAccountResp = z.infer<typeof Dto.recoverAccountResp>;
