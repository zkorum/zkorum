import { z } from "zod";
import { validateDidKey, validateDidWeb } from "../did/util.js";
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
export const zodDevice = z
    .object({
        didWrite: zodDidKey,
        userAgent: z.string(),
    })
    .strict();
export const zodDevices = z.array(zodDevice); // list of didWrite of all the devices belonging to a user
export const zodsecretCredentialRequest = z
    .object({
        blindedRequest: z.record(z.string(), z.unknown()),
        encryptedEncodedBlindedSubject: z.string(),
        encryptedEncodedBlinding: z.string(),
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
    })
    .strict();
export const zodPostUid = z.string(); // TODO it's a CID actually
export const zodPseudonym = z.string().nonempty();
export const zodPostAs = z
    .object({
        pseudonym: zodPseudonym,
        domain: z.string(), // TODO: a domain like acme.edu
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
export type Device = z.infer<typeof zodDevice>;
export type Devices = z.infer<typeof zodDevices>;
export type Post = z.infer<typeof zodPost>;
export type ExtendedPostData = z.infer<typeof zodExtendedPostData>;
export type PostAs = z.infer<typeof zodPostAs>;
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
