import { z } from "zod";
import { ZodType } from "./shared/types/zod.js";

export class Dto {
  static authenticateRequestBody = z.object({
    email: ZodType.email,
    userId: ZodType.userId,
    didExchange: ZodType.didKey,
  });
  static validateOtpReqBody = z.object({
    code: ZodType.code,
  });
  static authenticateResponse = z.object({
    codeExpiry: z.date(),
  });
  static validateOtpResponse = z.discriminatedUnion("success", [
    z.object({ success: z.literal(true) }),
    z.object({
      success: z.literal(false),
      reason: z.enum(["expired_code", "wrong_guess"]),
    }),
  ]);
}

export type AuthenticateRequestBody = z.infer<
  typeof Dto.authenticateRequestBody
>;
export type ValidateOtpResponse = z.infer<typeof Dto.validateOtpResponse>;
export type ValidateEmailReqBody = z.infer<typeof Dto.validateOtpReqBody>;
