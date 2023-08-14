/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";

export class ZodType {
  static email = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address");
  static didKey = z
    .string()
    .describe("Decentralized Identifier with did:key method")
    .max(1000)
    .refine(
      (val) => {
        return validateDidKey(val);
      },
      {
        message: "Please use a base58-encoded DID formatted `did:key:z...`",
      }
    );
  static didWeb = z
    .string()
    .describe("Decentralized Identifier with did:web method")
    .max(1000)
    .refine(
      (val) => {
        return validateDidWeb(val);
      },
      {
        message: "Please use a valid DID formatted `did:web:...`",
      }
    );
  static code = z.coerce.number().min(0).max(999999);
  static userId = z.string().uuid().nonempty();
}
