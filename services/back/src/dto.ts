import { z } from "zod";
import { ZodType } from "./shared/types/zod.js";

export class Dto {
  static registerRequestBody = z.object({
    email: ZodType.email,
    didExchange: ZodType.didKey,
  });
}

export type RegisterRequestBody = z.infer<typeof Dto.registerRequestBody>;
