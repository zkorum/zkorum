/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";

export class Dto {
  static email = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address");
  static username = z
    .string()
    .describe("Username")
    .max(32)
    .refine(
      (val) => {
        // @ts-ignore (validator is loaded using validator.min.js)
        return validator.isAlphanumeric(val) && !validator.isInt(val);
      },
      {
        message: "Username must only use alphanumerics characters",
      }
    );
}
