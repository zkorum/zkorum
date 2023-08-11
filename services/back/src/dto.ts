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
    codeId: ZodType.codeId,
  });
  static authenticateResponse = z.object({
    codeId: ZodType.codeId,
    codeExpiry: z.date(),
  });
}

export type AuthenticateRequestBody = z.infer<
  typeof Dto.authenticateRequestBody
>;
export type ValidateEmailReqBody = z.infer<typeof Dto.validateOtpReqBody>;
