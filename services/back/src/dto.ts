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
    });
    static authenticateResponse = z
        .object({
            codeExpiry: z.date(),
            nextCodeSoonestTime: z.date(),
        })
        .strict();
    static verifyOtpResponse = z.discriminatedUnion("success", [
        z.object({ success: z.literal(true), userId: ZodType.userId }).strict(),
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
}
export type VerifyOtpResponse = z.infer<typeof Dto.verifyOtpResponse>;
export type VerifyOtpReqBody = z.infer<typeof Dto.verifyOtpReqBody>;
export type IsLoggedInResponse = z.infer<typeof Dto.isLoggedInResponse>;
