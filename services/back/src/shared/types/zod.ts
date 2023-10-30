/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import {
    maxStudentYear,
    EssecCampus,
    EssecProgram,
    minStudentYear,
    UniversityType,
} from "./university.js";
import { type TCountryCode } from "countries-list";

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
    static secretCredentialType = z.string().uuid().or(z.literal("global"));
    static blindedCredential = z.string(); // generic "object" does not exist :(, so for now we just encode it
    static secretCredential = z
        .object({
            blindedCredential: ZodType.blindedCredential,
            encryptedBlinding: z.string(),
            encryptedBlindedSubject: z.string(),
        })
        .strict();
    static secretCredentials = z
        .object({
            active: ZodType.secretCredential.optional(),
            revoked: z.array(ZodType.secretCredential),
        })
        .strict();
    static secretCredentialsPerType = z.record(
        ZodType.secretCredentialType,
        ZodType.secretCredentials
    );
    static emailCredential = z.string(); // generic "object" does not exist :(, so for now we just encode it
    static emailCredentials = z
        .object({
            active: ZodType.emailCredential.optional(),
            revoked: z.array(ZodType.emailCredential),
        })
        .strict();
    static emailCredentialsPerEmail = z.record(
        ZodType.email,
        ZodType.emailCredentials
    );
    static devices = z.array(z.string()); // list of didWrite of all the devices belonging to a user
    static essecCampus = z.nativeEnum(EssecCampus);
    static essecProgram = z.nativeEnum(EssecProgram);
    static countryCode: z.ZodType<TCountryCode> = z.enum([
        "AD",
        "AE",
        "AF",
        "AG",
        "AI",
        "AL",
        "AM",
        "AO",
        "AQ",
        "AR",
        "AS",
        "AT",
        "AU",
        "AW",
        "AX",
        "AZ",
        "BA",
        "BB",
        "BD",
        "BE",
        "BF",
        "BG",
        "BH",
        "BI",
        "BJ",
        "BL",
        "BM",
        "BN",
        "BO",
        "BQ",
        "BR",
        "BS",
        "BT",
        "BV",
        "BW",
        "BY",
        "BZ",
        "CA",
        "CC",
        "CD",
        "CF",
        "CG",
        "CH",
        "CI",
        "CK",
        "CL",
        "CM",
        "CN",
        "CO",
        "CR",
        "CU",
        "CV",
        "CW",
        "CX",
        "CY",
        "CZ",
        "DE",
        "DJ",
        "DK",
        "DM",
        "DO",
        "DZ",
        "EC",
        "EE",
        "EG",
        "EH",
        "ER",
        "ES",
        "ET",
        "FI",
        "FJ",
        "FK",
        "FM",
        "FO",
        "FR",
        "GA",
        "GB",
        "GD",
        "GE",
        "GF",
        "GG",
        "GH",
        "GI",
        "GL",
        "GM",
        "GN",
        "GP",
        "GQ",
        "GR",
        "GS",
        "GT",
        "GU",
        "GW",
        "GY",
        "HK",
        "HM",
        "HN",
        "HR",
        "HT",
        "HU",
        "ID",
        "IE",
        "IL",
        "IM",
        "IN",
        "IO",
        "IQ",
        "IR",
        "IS",
        "IT",
        "JE",
        "JM",
        "JO",
        "JP",
        "KE",
        "KG",
        "KH",
        "KI",
        "KM",
        "KN",
        "KP",
        "KR",
        "KW",
        "KY",
        "KZ",
        "LA",
        "LB",
        "LC",
        "LI",
        "LK",
        "LR",
        "LS",
        "LT",
        "LU",
        "LV",
        "LY",
        "MA",
        "MC",
        "MD",
        "ME",
        "MF",
        "MG",
        "MH",
        "MK",
        "ML",
        "MM",
        "MN",
        "MO",
        "MP",
        "MQ",
        "MR",
        "MS",
        "MT",
        "MU",
        "MV",
        "MW",
        "MX",
        "MY",
        "MZ",
        "NA",
        "NC",
        "NE",
        "NF",
        "NG",
        "NI",
        "NL",
        "NO",
        "NP",
        "NR",
        "NU",
        "NZ",
        "OM",
        "PA",
        "PE",
        "PF",
        "PG",
        "PH",
        "PK",
        "PL",
        "PM",
        "PN",
        "PR",
        "PS",
        "PT",
        "PW",
        "PY",
        "QA",
        "RE",
        "RO",
        "RS",
        "RU",
        "RW",
        "SA",
        "SB",
        "SC",
        "SD",
        "SE",
        "SG",
        "SH",
        "SI",
        "SJ",
        "SK",
        "SL",
        "SM",
        "SN",
        "SO",
        "SR",
        "SS",
        "ST",
        "SV",
        "SX",
        "SY",
        "SZ",
        "TC",
        "TD",
        "TF",
        "TG",
        "TH",
        "TJ",
        "TK",
        "TL",
        "TM",
        "TN",
        "TO",
        "TR",
        "TT",
        "TV",
        "TW",
        "TZ",
        "UA",
        "UG",
        "UM",
        "US",
        "UY",
        "UZ",
        "VA",
        "VC",
        "VE",
        "VG",
        "VI",
        "VN",
        "VU",
        "WF",
        "WS",
        "XK",
        "YE",
        "YT",
        "ZA",
        "ZM",
        "ZW",
    ]);
    static studentAdmissionYear = z
        .number()
        .positive()
        .int()
        .min(minStudentYear)
        .max(maxStudentYear);
    static emailCredentialRequest = z.discriminatedUnion("type", [
        z
            .object({
                type: z.literal(UniversityType.STUDENT),
                campus: ZodType.essecCampus,
                program: ZodType.essecProgram,
                countries: z.record(ZodType.countryCode, z.boolean()),
                admissionYear: ZodType.studentAdmissionYear,
            })
            .strict(),
        z
            .object({
                type: z.literal(UniversityType.ALUM),
                // TODO
            })
            .strict(),
        z
            .object({
                type: z.literal(UniversityType.FACULTY),
                // TODO
            })
            .strict(),
    ]);
    static secretCredentialRequest = z
        .object({
            blindedRequest: z.record(z.string(), z.unknown()),
            encryptedEncodedBlindedSubject: z.string(),
            encryptedEncodedBlinding: z.string(),
        })
        .strict();
    static credentials = z.object({
        emailCredential: ZodType.emailCredential,
        blindedCredential: ZodType.blindedCredential,
    });
}
type Email = z.infer<typeof ZodType.email>;
export type Credentials = z.infer<typeof ZodType.credentials>;
export type SecretCredentialType = z.infer<typeof ZodType.secretCredentialType>;
export type SecretCredential = z.infer<typeof ZodType.secretCredential>;
export type SecretCredentials = z.infer<typeof ZodType.secretCredentials>;
export type SecretCredentialsPerType = z.infer<
    typeof ZodType.secretCredentialsPerType
>;
export type BlindedCredentialType = z.infer<typeof ZodType.blindedCredential>;
export type SecretCredentialRequest = z.infer<
    typeof ZodType.secretCredentialRequest
>;
export type EmailCredential = z.infer<typeof ZodType.emailCredential>;
export type EmailCredentials = z.infer<typeof ZodType.emailCredentials>;
export type EmailCredentialsPerEmail = z.infer<
    typeof ZodType.emailCredentialsPerEmail
>;
export type EmailCredentialRequest = z.infer<
    typeof ZodType.emailCredentialRequest
>;
export type Devices = z.infer<typeof ZodType.devices>;
export type StudentAdmissionYear = z.infer<typeof ZodType.studentAdmissionYear>;
