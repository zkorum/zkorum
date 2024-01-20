/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import {
    zodCreateCommentPayload,
    zodResponseToPollPayload,
    zodauthorizedEmail,
    zodblindedCredential,
    zodcode,
    zoddevices,
    zoddidKey,
    zodemail,
    zodemailCredential,
    zodemailCredentialsPerEmail,
    zodExtendedPostData,
    zodformCredential,
    zodformCredentialRequest,
    zodformCredentialsPerEmail,
    zodPost,
    zodPostUid,
    zodsecretCredentialRequest,
    zodsecretCredentialType,
    zodsecretCredentialsPerType,
    zoduserId,
    zodSlugId,
    zodComment,
} from "./zod.js";

export class Dto {
    static authenticateRequestBody = z
        .object({
            email: zodauthorizedEmail,
            didExchange: zoddidKey,
            isRequestingNewCode: z.boolean(),
        })
        .strict();
    static verifyOtpReqBody = z.object({
        code: zodcode,
        encryptedSymmKey: z.string().optional(),
        timeboundSecretCredentialRequest: zodsecretCredentialRequest.optional(),
        unboundSecretCredentialRequest: zodsecretCredentialRequest.optional(),
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
                encryptedSymmKey: z.string().optional(), // if undefined, device is awaiting synchronization
                syncingDevices: zoddevices,
                emailCredentialsPerEmail: zodemailCredentialsPerEmail,
                formCredentialsPerEmail: zodformCredentialsPerEmail,
                secretCredentialsPerType: zodsecretCredentialsPerType,
            })
            .strict(),
        z
            .object({
                success: z.literal(false),
                reason: z.enum([
                    "expired_code",
                    "wrong_guess",
                    "too_many_wrong_guess",
                    "encrypted_symm_key_required",
                    "unbound_secret_credential_request_required",
                    "timebound_secret_credential_request_required",
                    "secret_credential_requests_required", // both are undefined
                ]),
            })
            .strict(),
    ]);
    static auth409 = z.discriminatedUnion("reason", [
        z.object({
            reason: z.literal("awaiting_syncing"),
            userId: zoduserId,
        }),
        z.object({
            reason: z.literal("already_logged_in"),
            userId: zoduserId,
            encryptedSymmKey: z.string(),
            syncingDevices: zoddevices,
            emailCredentialsPerEmail: zodemailCredentialsPerEmail,
            formCredentialsPerEmail: zodformCredentialsPerEmail,
            secretCredentialsPerType: zodsecretCredentialsPerType,
        }),
    ]);

    static sync409 = z
        .object({
            reason: z.literal("already_syncing"),
            userId: zoduserId,
        })
        .strict();
    static isLoggedInResponse = z.discriminatedUnion("isLoggedIn", [
        z.object({ isLoggedIn: z.literal(true), userId: zoduserId }).strict(),
        z
            .object({
                isLoggedIn: z.literal(false),
            })
            .strict(),
    ]);
    static getDeviceStatusResp = z
        .discriminatedUnion("isSyncing", [
            z
                .object({
                    userId: zoduserId,
                    isLoggedIn: z.boolean(),
                    isSyncing: z.literal(true),
                    encryptedSymmKey: z.string(),
                })
                .strict(),
            z
                .object({
                    userId: zoduserId,
                    isLoggedIn: z.boolean(),
                    isSyncing: z.literal(false),
                })
                .strict(),
        ])
        .optional();
    static userCredentials = z
        .object({
            emailCredentialsPerEmail: zodformCredentialsPerEmail,
            formCredentialsPerEmail: zodformCredentialsPerEmail,
            secretCredentialsPerType: zodsecretCredentialsPerType,
        })
        .strict();
    static emailSecretCredentials = z
        .object({
            emailCredentialsPerEmail: zodemailCredentialsPerEmail,
            secretCredentialsPerType: zodsecretCredentialsPerType,
        })
        .strict();
    static requestFormCredential = z.object({
        email: zodemail,
        formCredentialRequest: zodformCredentialRequest,
    });
    static requestFormCredential200 = z.object({
        formCredentialsPerEmail: zodformCredentialsPerEmail,
    });
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
    static renewFormCredential = z.object({
        email: zodemail,
    });
    static renewFormCredential200 = z.object({
        formCredential: zodformCredential,
    });
    static commentRequest = z.object({
        pres: z.unknown(), // z.object() does not exist :(
        payload: zodCreateCommentPayload,
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
