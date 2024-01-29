/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
import { range } from "../common/util.js";
import { EssecCampus, EssecProgram } from "./university.js";
import { type TCountryCode } from "countries-list";
import {
    MAX_LENGTH_TITLE,
    MAX_LENGTH_OPTION,
    MAX_LENGTH_BODY,
} from "../shared.js";

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
export const zodDidKey = z
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
export const zodDevice = z
    .object({
        didWrite: zodDidKey,
        userAgent: z.string(),
    })
    .strict();
export const zodDevices = z.array(zodDevice); // list of didWrite of all the devices belonging to a user
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
export const zodPostTitle = z.string().max(MAX_LENGTH_TITLE).nonempty();
export const zodPostBody = z.string().max(MAX_LENGTH_BODY).nonempty();
export const zodPollOption = z.string().max(MAX_LENGTH_OPTION).nonempty();
export const zodPollOptionResponse = z.number().nonnegative();
export const zodPollOptions = z
    .object({
        option1: zodPollOption,
        option2: zodPollOption,
        option3: zodPollOption.optional(),
        option4: zodPollOption.optional(),
        option5: zodPollOption.optional(),
        option6: zodPollOption.optional(),
    })
    .strict();
export const zodPollResult = z
    .object({
        option1Response: zodPollOptionResponse,
        option2Response: zodPollOptionResponse,
        option3Response: zodPollOptionResponse.optional(),
        option4Response: zodPollOptionResponse.optional(),
        option5Response: zodPollOptionResponse.optional(),
        option6Response: zodPollOptionResponse.optional(),
    })
    .strict();
export const zodPollWithResults = z
    .object({
        options: zodPollOptions,
        result: zodPollResult,
    })
    .strict();
export const zodPostData = z
    .object({
        title: zodPostTitle,
        body: zodPostBody.optional(),
        poll: zodPollOptions.optional(),
    })
    .strict();
export const zodPostDataWithResult = z
    .object({
        title: zodPostTitle,
        body: zodPostBody.optional(),
        poll: zodPollWithResults.optional(),
    })
    .strict();
export const zodPost = z
    .object({
        data: zodPostData,
        eligibility: zodeligibility.optional(),
    })
    .strict();
export const zodPostUid = z.string(); // TODO it's a CID actually
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
export const zodSlugId = z.string().max(10);
export const zodCommentCount = z.number().int().nonnegative();
export const zodPostMetadata = z
    .object({
        uid: zodPostUid,
        slugId: zodSlugId,
        isHidden: z.boolean().optional(),
        updatedAt: z.date(),
        lastReactedAt: z.date(),
        commentCount: zodCommentCount,
    })
    .strict();
export const zodExtendedPostData = z
    .object({
        metadata: zodPostMetadata,
        payload: zodPostDataWithResult,
        author: zodPostAs,
        eligibility: zodEligibilities,
    })
    .strict();
const zodOptionChosen = z.number().int().positive();
export const zodResponseToPollPayload = z
    .object({ postUid: zodPostUid, optionChosen: zodOptionChosen })
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

export const zodPollResponsesByPostUid = z.record(
    zodPostUid,
    zodPollOptionChosenAndPseudonym
);
export const zodCommentContent = z.string().nonempty().max(1250);
export const zodCommentMetadata = z
    .object({
        uid: zodPostUid,
        slugId: zodSlugId,
        isHidden: z.boolean().optional(),
        updatedAt: z.date(),
    })
    .strict();
export const zodComment = z
    .object({
        metadata: zodCommentMetadata,
        content: zodCommentContent,
        author: zodPostAs,
    })
    .strict();
export const zodCreateCommentPayload = z.object({
    postUid: zodPostUid,
    content: zodCommentContent,
});
export const zodPostId = z.number().positive().int();

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
export type Device = z.infer<typeof zodDevice>;
export type Devices = z.infer<typeof zodDevices>;
export type StudentAdmissionYear = z.infer<typeof zodstudentAdmissionYear>;
export type Eligibility = z.infer<typeof zodeligibility>;
export type Post = z.infer<typeof zodPost>;
export type ExtendedPostData = z.infer<typeof zodExtendedPostData>;
export type Countries = z.infer<typeof zodcountries>;
export type WebDomainType = z.infer<typeof zodwebDomainType>;
export const webDomainTypes = zodwebDomainType.options;
export type UniversityType = z.infer<typeof zoduniversityType>;
export const universityTypes = zoduniversityType.options;
export type PostAs = z.infer<typeof zodPostAs>;
export type Eligibilities = z.infer<typeof zodEligibilities>; // TODO merge this with Eligibility
export type PollResult = z.infer<typeof zodPollResult>;
export type PostData = z.infer<typeof zodPostData>;
export type ResponseToPollPayload = z.infer<typeof zodResponseToPollPayload>;
export type ResponseToPoll = z.infer<typeof zodResponseToPoll>;
export type PollOptionAndPseudonym = z.infer<
    typeof zodPollOptionChosenAndPseudonym
>;
export type PollResponsesByPostUid = z.infer<typeof zodPollResponsesByPostUid>;
export type PostUid = z.infer<typeof zodPostUid>;
export type PollMetadata = z.infer<typeof zodPostMetadata>;
export type PostComment = z.infer<typeof zodComment>;
export type PostPseudonym = z.infer<typeof zodPseudonym>;
export type CommentContent = z.infer<typeof zodCommentContent>;
export type CreateCommentPayload = z.infer<typeof zodCreateCommentPayload>;
export type PostSlugId = z.infer<typeof zodSlugId>;
export type PostId = z.infer<typeof zodPostId>;
export type PollOptions = z.infer<typeof zodPollOptions>;
