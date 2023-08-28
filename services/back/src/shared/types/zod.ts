/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import validator from "validator";

function isAuthorizedEmail(email: Email, authorizedFQDNs: FQDN[]) {
  const fqdn = email.split("@")[1]; // this should not throw an error because it is already validated as an email
  // TODO: figure this out!
  // this should not happen but for some reason VITE seems not to parse import.meta.env.VITE_AUTHORIZED_FQDNS as expected - keeping it as string, but typescript thinks it does....
  // I tried with transform - same issue
  if (typeof authorizedFQDNs === "string") {
    const authorizedFQDNsStr = authorizedFQDNs as string;
    const listOfAuthorizedFQDNs = authorizedFQDNsStr.trim().split(",");
    if (listOfAuthorizedFQDNs.includes(fqdn)) {
      return true;
    } else {
      return false;
    }
  } else {
    if (authorizedFQDNs.includes(fqdn)) {
      return true;
    } else {
      return false;
    }
  }
}

export class ZodType {
  static email = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address");
  static fqdn = z
    .string()
    .nonempty()
    .refine((domain: string) => {
      // @ts-ignore
      return validator.isFQDN(domain);
    });
  static fqdns = z.preprocess(
    (val) =>
      String(val)
        .trim()
        .split(",")
        .filter((v) => v !== ""),
    z
      .string()
      .nonempty()
      .refine((val: string) => {
        // @ts-ignore
        return validator.isFQDN(val);
      })
      .array()
      .nonempty()
  );
  static authorizedEmail(authorizedFQDNs: FQDN[]) {
    return z
      .string()
      .email()
      .max(254)
      .nonempty()
      .describe("Email address")
      .refine((email: string) => {
        return isAuthorizedEmail(email, authorizedFQDNs);
      });
  }
  static didKey = z
    .string()
    .describe("Decentralized Identifier with did:key method")
    .max(1000)
    .refine(
      (val: string) => {
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
      (val: string) => {
        return validateDidWeb(val);
      },
      {
        message: "Please use a valid DID formatted `did:web:...`",
      }
    );
  static code = z.coerce.number().min(0).max(999999);
  static digit = z.coerce.number().int().nonnegative().lte(9);
  static userId = z.string().uuid().nonempty();
}
type Email = z.infer<typeof ZodType.email>;
export type FQDN = z.infer<typeof ZodType.fqdn>;
