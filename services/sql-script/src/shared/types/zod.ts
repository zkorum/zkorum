/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import { range } from "../common/util.js";
import { EssecCampus, EssecProgram } from "./university.js";
import { type TCountryCode } from "countries-list";
import { MAX_LENGTH_TITLE, MAX_LENGTH_OPTION } from "../shared.js";

// Alpha only for ESSEC
function isAuthorizedEmail(email: Email) {
    const preprocessedEmail = email.trim();
    const [localPart, fqdn] = preprocessedEmail.split("@");
    if (
        (preprocessedEmail.startsWith("b") &&
            /^\d+$/.test(localPart.substring(1)) &&
            fqdn === "essec.edu") ||
        fqdn === "zkorum.com"
    ) {
        return true;
    } else {
        return false;
    }
}

const currentYear = new Date().getFullYear();
export const minStudentYear = currentYear - 9;
export const maxStudentYear = currentYear + 1;
export const currentStudentsAdmissionYears = range(
    currentYear - 9,
    currentYear + 1
);

export const zodstudentAdmissionYear = z
    .number()
    .positive()
    .int()
    .min(minStudentYear)
    .max(maxStudentYear);
export const zodemail = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address");
export const zodauthorizedEmail = z
    .string()
    .email()
    .max(254)
    .nonempty()
    .describe("Email address")
    .toLowerCase()
    .refine((email: string) => {
        return isAuthorizedEmail(email);
    });
export const zoddidKey = z
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
export const zodDidWeb = z
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
export const zodcode = z.coerce.number().min(0).max(999999);
export const zoddigit = z.coerce.number().int().nonnegative().lte(9);
export const zoduserId = z.string().uuid().nonempty();
export const zodsecretCredentialType = z.enum(["unbound", "timebound"]);
export const zodblindedCredential = z.string(); // generic "object" does not exist :(, so for now we just encode it
export const zodunblindedSecretCredential = z.string(); // generic "object" does not exist :(, so for now we just encode it
export const zodsecretCredential = z
    .object({
        blindedCredential: zodblindedCredential,
        encryptedBlinding: z.string(),
        encryptedBlindedSubject: z.string(),
    })
    .strict();
export const zodsecretCredentials = z
    .object({
        active: zodsecretCredential.optional(),
        revoked: z.array(zodsecretCredential),
    })
    .strict();
export const zodunblindedSecretCredentials = z
    .object({
        active: zodunblindedSecretCredential.optional(),
        revoked: z.array(zodunblindedSecretCredential),
    })
    .strict();
export const zodunblindedSecretCredentialsPerType = z.record(
    zodsecretCredentialType,
    zodunblindedSecretCredentials
);
export const zodsecretCredentialsPerType = z.record(
    zodsecretCredentialType,
    zodsecretCredentials
);
export const zodemailCredential = z.string(); // generic "object" does not exist :(, so for now we just encode it
export const zodemailCredentials = z
    .object({
        active: zodemailCredential.optional(),
        revoked: z.array(zodemailCredential),
    })
    .strict();
export const zodemailCredentialsPerEmail = z.record(
    zodemail,
    zodemailCredentials
);
export const zodformCredential = zodemailCredential;
export const zodformCredentials = z
    .object({
        active: zodformCredential.optional(),
        revoked: z.array(zodemailCredential),
    })
    .strict();
export const zodformCredentialsPerEmail = z.record(
    zodemail,
    zodformCredentials
);
export const zodemailFormCredentialsPerEmail = z.object({
    emailCredentialsPerEmail: zodemailCredentialsPerEmail,
    formCredentialsPerEmail: zodformCredentialsPerEmail,
});
export const zoddevices = z.array(z.string()); // list of didWrite of all the devices belonging to a user
export const zodessecCampus = z.nativeEnum(EssecCampus);
export const zodessecProgram = z.nativeEnum(EssecProgram);
export const zodcountryCode: z.ZodType<TCountryCode> = z.enum([
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
export const zoduniversityType = z.enum(["student", "alum", "faculty"]);
export const zodwebDomainType = z.enum(["university", "company"]); // duplicate from db
export const zodcountries = z.record(zodcountryCode, z.boolean());
export const zodformCredentialRequest = z.discriminatedUnion("type", [
    z
        .object({
            type: z.literal(zoduniversityType.enum.student),
            campus: zodessecCampus,
            program: zodessecProgram,
            countries: zodcountries,
            admissionYear: zodstudentAdmissionYear,
        })
        .strict(),
    z
        .object({
            type: z.literal(zoduniversityType.enum.alum),
            // TODO
        })
        .strict(),
    z
        .object({
            type: z.literal(zoduniversityType.enum.faculty),
            // TODO
        })
        .strict(),
]);
export const zodsecretCredentialRequest = z
    .object({
        blindedRequest: z.record(z.string(), z.unknown()),
        encryptedEncodedBlindedSubject: z.string(),
        encryptedEncodedBlinding: z.string(),
    })
    .strict();
export const zodformAndBlindedCredentials = z.object({
    formCredential: zodformCredential,
    blindedCredential: zodblindedCredential,
});
export const zodeligibility = z
    .object({
        student: z.boolean().optional(),
        alum: z.boolean().optional(),
        faculty: z.boolean().optional(),
        countries: z.array(z.enum(["FR", "INT"])).optional(),
        campuses: z.array(zodessecCampus).optional(),
        programs: z.array(zodessecProgram).optional(),
        admissionYears: z.array(zodstudentAdmissionYear).optional(),
    })
    .strict();
export const zodpollQuestion = z.string().max(MAX_LENGTH_TITLE).nonempty();
export const zodpollOption = z.string().max(MAX_LENGTH_OPTION).nonempty();
export const zodpollOptionResponse = z.number().nonnegative();
export const zodpollData = z
    .object({
        question: zodpollQuestion,
        option1: zodpollOption,
        option2: zodpollOption,
        option3: zodpollOption.optional(),
        option4: zodpollOption.optional(),
        option5: zodpollOption.optional(),
        option6: zodpollOption.optional(),
    })
    .strict();
export const zodpollResult = z
    .object({
        option1Response: zodpollOptionResponse,
        option2Response: zodpollOptionResponse,
        option3Response: zodpollOptionResponse.optional(),
        option4Response: zodpollOptionResponse.optional(),
        option5Response: zodpollOptionResponse.optional(),
        option6Response: zodpollOptionResponse.optional(),
    })
    .strict();
export const zodpoll = z
    .object({
        data: zodpollData,
        eligibility: zodeligibility.optional(),
    })
    .strict();
export const zodpollUID = z.string(); // TODO it's a CID actually
export const zodPseudonym = z.string().nonempty();
export const zodPostAs = z
    .object({
        pseudonym: zodPseudonym,
        domain: z.string(), // TODO: a domain like acme.edu
        type: zodwebDomainType,
        university: z
            .object({
                type: zoduniversityType, //TODO it's an enum...!
                student: z
                    .object({
                        countries: z.array(zodcountryCode).optional(),
                        campus: z.string().optional(),
                        program: z.string().optional(),
                        admissionYear: zodstudentAdmissionYear.optional(),
                    })
                    .strict()
                    .optional(),
            })
            .strict()
            .optional(),
    })
    .strict();
export const zodEligibilities = z // TODO merge this with zodeligibility
    .object({
        domains: z.array(z.string()).optional(),
        types: z.array(zodwebDomainType).optional(),
        university: z
            .object({
                types: z.array(zoduniversityType).optional(),
                student: z
                    .object({
                        countries: z.array(zodcountryCode).optional(),
                        campuses: z.array(z.string()).optional(),
                        programs: z.array(z.string()).optional(),
                        admissionYears: z
                            .array(zodstudentAdmissionYear)
                            .optional(),
                    })
                    .strict()
                    .optional(),
            })
            .strict()
            .optional(),
    })
    .strict();
export const zodSlug = z.string().max(10);
export const zodPollMetadata = z
    .object({
        uid: zodpollUID,
        slug: zodSlug,
        isHidden: z.boolean().optional(),
        updatedAt: z.date(),
    })
    .strict();
export const zodextendedPollData = z
    .object({
        metadata: zodPollMetadata,
        payload: z
            .object({
                data: zodpollData,
                result: zodpollResult,
            })
            .strict(),
        author: zodPostAs,
        eligibility: zodEligibilities,
    })
    .strict();
const zodOptionChosen = z.number().int().positive();
export const zodResponseToPollPayload = z
    .object({ pollUid: zodpollUID, optionChosen: zodOptionChosen })
    .strict();
export const zodResponseToPoll = z
    .object({
        payload: zodResponseToPollPayload,
        metadata: z.object({ action: z.literal("respondToPoll") }),
    })
    .strict();
export const zodPollOptionChosenAndPseudonym = z
    .object({
        respondentPseudonym: zodPseudonym,
        optionChosen: zodOptionChosen,
    })
    .strict();

export const zodPollResponsesByPollUid = z.record(
    zodpollUID,
    zodPollOptionChosenAndPseudonym
);
export const zodCommentPayload = z.string().nonempty().max(1250);
export const zodComment = z
    .object({
        metadata: zodPollMetadata,
        payload: zodCommentPayload,
        author: zodPostAs,
    })
    .strict();

type Email = z.infer<typeof zodemail>;
export type FormAndBlindedCredentials = z.infer<
    typeof zodformAndBlindedCredentials
>;
export type SecretCredentialType = z.infer<typeof zodsecretCredentialType>;
export type UnblindedSecretCredential = z.infer<
    typeof zodunblindedSecretCredential
>;
export type SecretCredential = z.infer<typeof zodsecretCredential>;
export type SecretCredentials = z.infer<typeof zodsecretCredentials>;
export type UnblindedSecretCredentials = z.infer<
    typeof zodunblindedSecretCredentials
>;
export type SecretCredentialsPerType = z.infer<
    typeof zodsecretCredentialsPerType
>;
export type UnblindedSecretCredentialsPerType = z.infer<
    typeof zodunblindedSecretCredentialsPerType
>;
export type BlindedCredentialType = z.infer<typeof zodblindedCredential>;
export type SecretCredentialRequest = z.infer<
    typeof zodsecretCredentialRequest
>;
export type EmailCredential = z.infer<typeof zodemailCredential>;
export type EmailCredentials = z.infer<typeof zodemailCredentials>;
export type EmailCredentialsPerEmail = z.infer<
    typeof zodemailCredentialsPerEmail
>;
export type FormCredential = z.infer<typeof zodformCredential>;
export type FormCredentials = z.infer<typeof zodformCredentials>;
export type FormCredentialsPerEmail = z.infer<
    typeof zodformCredentialsPerEmail
>;
export type FormCredentialRequest = z.infer<typeof zodformCredentialRequest>;
export type EmailFormCredentialsPerEmail = z.infer<
    typeof zodemailFormCredentialsPerEmail
>;
export type Devices = z.infer<typeof zoddevices>;
export type StudentAdmissionYear = z.infer<typeof zodstudentAdmissionYear>;
export type Eligibility = z.infer<typeof zodeligibility>;
export type Poll = z.infer<typeof zodpoll>;
export type ExtendedPollData = z.infer<typeof zodextendedPollData>;
export type Countries = z.infer<typeof zodcountries>;
export type WebDomainType = z.infer<typeof zodwebDomainType>;
export const webDomainTypes = zodwebDomainType.options;
export type UniversityType = z.infer<typeof zoduniversityType>;
export const universityTypes = zoduniversityType.options;
export type PostAs = z.infer<typeof zodPostAs>;
export type Eligibilities = z.infer<typeof zodEligibilities>; // TODO merge this with Eligibility
export type PollResult = z.infer<typeof zodpollResult>;
export type PollData = z.infer<typeof zodpollData>;
export type ResponseToPollPayload = z.infer<typeof zodResponseToPollPayload>;
export type ResponseToPoll = z.infer<typeof zodResponseToPoll>;
export type PollOptionAndPseudonym = z.infer<
    typeof zodPollOptionChosenAndPseudonym
>;
export type PollResponsesByPollUid = z.infer<typeof zodPollResponsesByPollUid>;
export type PollUid = z.infer<typeof zodpollUID>;
export type PollMetadata = z.infer<typeof zodPollMetadata>;
export type PostComment = z.infer<typeof zodComment>;
export type PostPseudonym = z.infer<typeof zodPseudonym>;
export type CommentPayload = z.infer<typeof zodCommentPayload>;
