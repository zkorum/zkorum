import {
    BBSPlusCredentialBuilder as CredentialBuilder,
    CredentialSchema,
    SUBJECT_STR,
    BBSPlusSecretKey as SecretKey,
    BBSPlusCredential as Credential,
    BBSPlusBlindedCredentialRequest as BlindedCredentialRequest,
    BBSPlusBlindedCredential as BlindedCredential,
} from "@docknetwork/crypto-wasm-ts";

enum WebDomainType {
    UNIVERSITY,
    // COMPANY
    // ADMINISTRATION / PUBLIC_SECTOR
    // ...
}

function getTypeFromEmail(_email: string): WebDomainType {
    // TODO: have list of known domain names for each type in a static file or in the DB
    // load it on startup, pass it here and compare with fqdn
    // const fqdn = email.trim().toLowerCase().split("@")[1]
    // 1st version only support university
    return WebDomainType.UNIVERSITY;
}

function _buildSecretBlindedCredential(
    email: string,
    blindCredentialRequest: BlindedCredentialRequest,
    sk: SecretKey
): BlindedCredential {
    // create blinded credential from blind credential request
    const result = blindCredentialRequest.verify([]);
    if (!result.verified) {
        throw new Error(result.error);
    }
    const blindedCredBuilder =
        blindCredentialRequest.generateBlindedCredentialBuilder();
    blindedCredBuilder.subject = {
        email: email,
    };
    // TODO accumulator and revocation status
    const blindedCred = blindedCredBuilder.sign(sk);
    return blindedCred;
}

export function buildEmailCredential(email: string, sk: SecretKey): Credential {
    const emailType = getTypeFromEmail(email);
    const schema = CredentialSchema.essential();
    // TODO: update schema depending on email type (university, company...etc)
    schema.properties[SUBJECT_STR] = {
        type: "object",
        properties: {
            email: { type: "string" },
            type: { type: "string" },
        },
    };
    const credSchema = new CredentialSchema(schema);

    const builder = new CredentialBuilder();
    builder.schema = credSchema;
    // TODO revocation status and such

    builder.subject = { email: email, type: WebDomainType[emailType] };
    return builder.sign(sk);
}

// interface EmailCredentials {
//     emailCredential: Credential;
//     secretBlindedCredential: BlindedCredential;
// }

// interface EmailCredentialsStr {
//     emailCredential: string;
//     secretBlindedCredential: string;
// }

// async function buildAndSaveEmailCredentials(
//     db: PostgresJsDatabase,
//     email: string,
//     secretBlindedCredentialRequest: BlindedCredentialRequest,
//     sk: SecretKey
// ): Promise<EmailCredentials> {
//     const emailCredential = buildEmailCredential(email, sk);
//     const secretBlindedCredential = buildSecretBlindedCredential(
//         email,
//         secretBlindedCredentialRequest,
//         sk
//     );
//     await db
//         .update(emailTable)
//         .set({
//             emailCredential: JSON.stringify(emailCredential.toJSON()),
//             secretBlindedCredential: JSON.stringify(
//                 secretBlindedCredential.toJSON()
//             ),
//         })
//         .where(eq(emailTable.email, email));
//     return { emailCredential, secretBlindedCredential };
// }

// function blindedCredentialRequestFromObj(
//     blindedCredentialRequestObj: object
// ): BlindedCredentialRequest | undefined {
//     try {
//         return BlindedCredentialRequest.fromJSON(blindedCredentialRequestObj);
//     } catch (e) {
//         log.error("Cannot parse blinded credential request", e);
//         return undefined;
//     }
// }

// async function getEmailCredentials(
//     db: PostgresJsDatabase,
//     email: string
// ): Promise<EmailCredentialsStr | undefined> {
//     const result = await db
//         .select({
//             emailCredential: emailTable.emailCredential,
//             secretBlindedCredential: emailTable.secretBlindedCredential,
//         })
//         .from(emailTable)
//         .where(eq(emailTable.email, email));
//     if (result.length === 0) {
//         return undefined;
//     } else {
//         console.log("\n\n\n", typeof result[0].emailCredential, "\n\n\n");
//         return {
//             emailCredential: result[0].emailCredential as string,
//             secretBlindedCredential: result[0]
//                 .secretBlindedCredential as string,
//         };
//     }
// }

// /**
//  * If credentials don't already exist, create and return them. Throw bad request error if secretBlindedCredentialRequest is malformed.
//  * If credentials already exist, then simply return them (syncing verification is already done).
//  * **/
// export async function createOrGetEmailCredentials(
//     db: PostgresJsDatabase,
//     email: string,
//     secretBlindedCredentialRequest: object,
//     sk: SecretKey,
//     httpErrors: HttpErrors
// ): Promise<CreateOrGetEmailCredentialsRes> {
//     // check if email is associated with given did
//     const emailCredentials = await getEmailCredentials(db, email);
//     if (emailCredentials === undefined) {
//         // credentials don't exist yet, create them
//         const blindedCredentialRequest = blindedCredentialRequestFromObj(
//             secretBlindedCredentialRequest
//         );
//         if (blindedCredentialRequest === undefined) {
//             throw httpErrors.badRequest("BlindedCredentialRequest is invalid");
//         }
//         const { emailCredential, secretBlindedCredential }: EmailCredentials =
//             await buildAndSaveEmailCredentials(
//                 db,
//                 email,
//                 blindedCredentialRequest,
//                 sk
//             );
//         return {
//             emailCredential: JSON.stringify(emailCredential.toJSON()),
//             secretBlindedCredential: JSON.stringify(
//                 secretBlindedCredential.toJSON()
//             ),
//         };
//     } else {
//         return emailCredentials;
//     }
// }
