import { z } from "zod";
import { ZodType } from "./shared/types/zod.js";

export class Dto {
  static authenticateRequestBody = z
    .object({
      email: ZodType.email,
      userId: ZodType.userId,
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
    z.object({ success: z.literal(true) }).strict(),
    z
      .object({
        success: z.literal(false),
        reason: z.enum(["expired_code", "wrong_guess", "too_many_wrong_guess"]),
      })
      .strict(),
  ]);
}

export type AuthenticateRequestBody = z.infer<
  typeof Dto.authenticateRequestBody
>;
export type ValidateOtpResponse = z.infer<typeof Dto.verifyOtpResponse>;
export type ValidateEmailReqBody = z.infer<typeof Dto.verifyOtpReqBody>;