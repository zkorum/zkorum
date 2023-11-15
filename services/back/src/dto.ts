import { z } from "zod";
import { ZodType } from "./shared/types/zod.js";

export class Dto {
    static authenticateRequestBody = z
        .object({
            email: ZodType.authorizedEmail,
            didExchange: ZodType.didKey,
            isRequestingNewCode: z.boolean(),
        })
        .strict();
    static verifyOtpReqBody = z.object({
        code: ZodType.code,
        encryptedSymmKey: z.string().optional(),
        timeboundSecretCredentialRequest:
            ZodType.secretCredentialRequest.optional(),
        unboundSecretCredentialRequest:
            ZodType.secretCredentialRequest.optional(),
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
                userId: ZodType.userId,
                encryptedSymmKey: z.string().optional(), // if undefined, device is awaiting synchronization
                syncingDevices: ZodType.devices,
                emailCredentialsPerEmail: ZodType.emailCredentialsPerEmail,
                formCredentialsPerEmail: ZodType.formCredentialsPerEmail,
                secretCredentialsPerType: ZodType.secretCredentialsPerType,
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
            userId: ZodType.userId,
        }),
        z.object({
            reason: z.literal("already_logged_in"),
            userId: ZodType.userId,
            encryptedSymmKey: z.string(),
            syncingDevices: ZodType.devices,
            emailCredentialsPerEmail: ZodType.emailCredentialsPerEmail,
            formCredentialsPerEmail: ZodType.formCredentialsPerEmail,
            secretCredentialsPerType: ZodType.secretCredentialsPerType,
        }),
    ]);

    static sync409 = z
        .object({
            reason: z.literal("already_syncing"),
            userId: ZodType.userId,
        })
        .strict();
    static isLoggedInResponse = z.discriminatedUnion("isLoggedIn", [
        z
            .object({ isLoggedIn: z.literal(true), userId: ZodType.userId })
            .strict(),
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
                    userId: ZodType.userId,
                    isLoggedIn: z.boolean(),
                    isSyncing: z.literal(true),
                    encryptedSymmKey: z.string(),
                })
                .strict(),
            z
                .object({
                    userId: ZodType.userId,
                    isLoggedIn: z.boolean(),
                    isSyncing: z.literal(false),
                })
                .strict(),
        ])
        .optional();
    static userCredentials = z
        .object({
            emailCredentialsPerEmail: ZodType.formCredentialsPerEmail,
            formCredentialsPerEmail: ZodType.formCredentialsPerEmail,
            secretCredentialsPerType: ZodType.secretCredentialsPerType,
        })
        .strict();
    static emailSecretCredentials = z
        .object({
            emailCredentialsPerEmail: ZodType.emailCredentialsPerEmail,
            secretCredentialsPerType: ZodType.secretCredentialsPerType,
        })
        .strict();
    static requestCredentials = z.object({
        email: ZodType.email,
        formCredentialRequest: ZodType.formCredentialRequest,
    });
    static requestCredentials200 = z.object({
        formCredentialsPerEmail: ZodType.formCredentialsPerEmail,
    });
    static createPollRequest = z.object({
        poll: ZodType.poll,
        pres: z.unknown(), // z.object() does not exist :(
    });
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
