import {
    BBSPlusCredentialBuilder as CredentialBuilder,
    CredentialSchema,
    SUBJECT_STR,
    BBSPlusSecretKey as SecretKey,
    BBSPlusCredential as Credential,
    BBSPlusBlindedCredentialRequest as BlindedCredentialRequest,
    BBSPlusBlindedCredential as BlindedCredential,
} from "@docknetwork/crypto-wasm-ts";
import {
    type EmailCredentialsPerEmail,
    type EmailCredential,
    type SecretCredential,
    type SecretCredentialType,
    type SecretCredentialsPerType,
    type SecretCredentials,
} from "../shared/types/zod.js";
import { log } from "../app.js";
import { domainFromEmail } from "@/shared/shared.js";
import { nowZeroMs } from "@/shared/common/util.js";

interface BuildSecretCredentialProps {
    blindedCredentialRequest: BlindedCredentialRequest;
    uid: string;
    type: SecretCredentialType;
    sk: SecretKey;
    version: string;
}

export function buildSecretCredential({
    blindedCredentialRequest,
    uid,
    type,
    sk,
    version,
}: BuildSecretCredentialProps): BlindedCredential {
    // create blinded credential from blind credential request
    const result = blindedCredentialRequest.verify([]);
    if (!result.verified) {
        throw new Error(result.error);
    }
    const blindedCredBuilder =
        blindedCredentialRequest.generateBlindedCredentialBuilder();
    const now = nowZeroMs();
    blindedCredBuilder.subject = {
        uid: uid,
        type: type,
        issuanceDatetime: now.toISOString(),
    };
    blindedCredBuilder.version = version;
    // TODO accumulator and revocation status
    const blindedCred = blindedCredBuilder.sign(sk);
    return blindedCred;
}

interface BuildEmailCredentialProps {
    email: string;
    uid: string;
    sk: SecretKey;
    version: string;
}

export function buildEmailCredential({
    email,
    uid,
    sk,
    version,
}: BuildEmailCredentialProps): Credential {
    const schema = CredentialSchema.essential();
    // TODO: pass schema as param depending on email type (university, company...etc) & specific domain that could override the default values
    schema.properties[SUBJECT_STR] = {
        type: "object",
        properties: {
            email: { type: "string" },
            domain: { type: "string" },
            uid: { type: "string" },
            issuanceDatetime: { type: "string", format: "date-time" },
        },
    };
    const credSchema = new CredentialSchema(schema);

    const builder = new CredentialBuilder();
    builder.version = version;
    builder.schema = credSchema;
    // TODO revocation status and such

    // log.warn(`\n\n\n${{ ...toCredProperties(emailCredentialRequest) }}\n\n\n`);

    const domain = domainFromEmail(email);
    if (domain === undefined) {
        throw new Error(`Unable to get domain from email '${email}'`);
    }

    const now = nowZeroMs();
    builder.subject = {
        email: email,
        domain: domain,
        uid: uid,
        issuanceDatetime: now.toISOString(),
    };
    return builder.sign(sk);
}

export function parseSecretCredentialRequest(
    blindedCredentialRequestObj: any
): BlindedCredentialRequest {
    return BlindedCredentialRequest.fromJSON(blindedCredentialRequestObj);
    // log.error("Cannot parse blinded credential request", e);
}

export function hasActiveCredential(
    email: string,
    emailCredentialsPerEmail: EmailCredentialsPerEmail
): boolean {
    if (
        email in emailCredentialsPerEmail &&
        emailCredentialsPerEmail[email].active !== undefined
    ) {
        return true;
    } else {
        return false;
    }
}

export function hasActiveSecretCredential(
    type: SecretCredentialType,
    secretCredentialsPerType: SecretCredentialsPerType
): boolean {
    if (
        type in secretCredentialsPerType &&
        secretCredentialsPerType[type]?.active !== undefined
    ) {
        return true;
    } else {
        return false;
    }
}

export function addActiveEmailCredential(
    email: string,
    encodedEmailCredential: EmailCredential,
    existingEmailCredentialsPerEmail: EmailCredentialsPerEmail
): EmailCredentialsPerEmail {
    const emailCredentialsPerEmail = {
        ...existingEmailCredentialsPerEmail,
    };
    if (hasActiveCredential(email, existingEmailCredentialsPerEmail)) {
        log.warn(
            "Replacing active email credential in an object that is not expected to have one"
        );
        emailCredentialsPerEmail[email].active = encodedEmailCredential;
    } else if (email in emailCredentialsPerEmail) {
        emailCredentialsPerEmail[email].active = encodedEmailCredential;
    } else {
        emailCredentialsPerEmail[email] = {
            active: encodedEmailCredential,
            revoked: [],
        };
    }
    return emailCredentialsPerEmail;
}

export function addActiveSecretCredential(
    type: SecretCredentialType,
    secretCredential: SecretCredential,
    existingSecretCredentialsPerType: SecretCredentialsPerType
): SecretCredentialsPerType {
    const secretCredentialsPerType = { ...existingSecretCredentialsPerType };
    if (hasActiveSecretCredential(type, existingSecretCredentialsPerType)) {
        log.warn(
            "Replacing active secret credential in an object that is not expected to have one"
        );
        (secretCredentialsPerType[type] as SecretCredentials).active =
            secretCredential;
    } else if (type in secretCredentialsPerType) {
        (secretCredentialsPerType[type] as SecretCredentials).active =
            secretCredential;
    } else {
        secretCredentialsPerType[type] = {
            active: secretCredential,
            revoked: [],
        };
    }
    return secretCredentialsPerType;
}

export interface PostAs {
    domain: string;
}
