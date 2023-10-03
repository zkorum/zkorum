import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";

// Alpha only for ESSEC
function isAuthorizedEmail(email: Email) {
    const preprocessedEmail = email.trim();
    const [localPart, fqdn] = preprocessedEmail.split("@");
    if (
        preprocessedEmail.startsWith("b") &&
        /^\d+$/.test(localPart.substring(1)) &&
        fqdn === "essec.edu"
    ) {
        return true;
    } else {
        return false;
    }
}

export class ZodType {
    static email = z
        .string()
        .email()
        .max(254)
        .nonempty()
        .describe("Email address");
    static authorizedEmail = z
        .string()
        .email()
        .max(254)
        .nonempty()
        .describe("Email address")
        .refine((email: string) => {
            return isAuthorizedEmail(email);
        });
    static didKey = z
        .string()
        .describe("Decentralized Identifier with did:key method")
        .max(1000)
        .refine(
            (val: string) => {
                return validateDidKey(val);
            },
            {
                message:
                    "Please use a base58-encoded DID formatted `did:key:z...`",
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
    static secretCredentials = z
        .object({
            active: z.string().optional(),
            revoked: z.array(z.string()),
        })
        .strict();
    static secretCredentialsPerType = z.record(
        z.string().uuid().or(z.literal("global")),
        ZodType.secretCredentials
    );
    static emailCredentials = z
        .object({
            active: z.string().optional(),
            revoked: z.array(z.string()),
        })
        .strict();
    static emailCredentialsPerEmail = z.record(
        ZodType.email,
        ZodType.emailCredentials
    );
    static devices = z.array(z.string()); // list of didWrite of all the devices belonging to a user
}
type Email = z.infer<typeof ZodType.email>;
export type SecretCredentials = z.infer<typeof ZodType.secretCredentials>;
export type SecretCredentialsPerType = z.infer<
    typeof ZodType.secretCredentialsPerType
>;
export type EmailCredentials = z.infer<typeof ZodType.emailCredentials>;
export type EmailCredentialsPerEmail = z.infer<
    typeof ZodType.emailCredentialsPerEmail
>;
export type Devices = z.infer<typeof ZodType.devices>;
