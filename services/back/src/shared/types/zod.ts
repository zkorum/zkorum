/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import validator from "validator";
import { validateDidKey, validateDidWeb } from "../did/util.js";

export class ZodType {
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
  static didKey = z
    .string()
    .describe("Decentralized Identifier with did:key method")
    .max(254)
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
    .max(254)
    .refine(
      (val) => {
        return validateDidWeb(val);
      },
      {
        message: "Please use a valid DID formatted `did:web:...`",
      }
    );
}
