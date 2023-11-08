import { randomNumbers } from "@/crypto/ucan/implementation/browser";
import { anyToUint8Array, uint8ArrayToJSON } from "@/shared/common/arrbufs";
import { base64 } from "@/shared/common/index";
import type {
    EmailCredentialsPerEmail,
    SecretCredential,
    SecretCredentialsPerType,
    UnblindedSecretCredential,
    UnblindedSecretCredentialsPerType,
} from "@/shared/types/zod";
import { cryptoStore } from "@/store/store";
import {
    BBSPlusBlindedCredentialRequestBuilder,
    BBSPlusBlindedCredential as BlindedCredential,
    BBSPlusBlinding as Blinding,
    CredentialSchema,
    SUBJECT_STR,
    initializeWasm,
    isWasmInitialized,
} from "@docknetwork/crypto-wasm-ts";
import { DEFAULT_AES_ALG } from "../basic";

function secretCredSchema() {
    const schema = CredentialSchema.essential();
    schema.properties[SUBJECT_STR] = {
        type: "object",
        properties: {
            userId: { type: "string" },
            email: { type: "string" },
            type: { type: "string" },
            secret: { type: "string" },
        },
    };
    return new CredentialSchema(schema);
}

// TODO: move this function once and for all at React app initialization stage
export async function maybeInitWasm() {
    if (isWasmInitialized()) {
        return;
    } else {
        await initializeWasm();
    }
}

function newReqBuilder(
    schema: CredentialSchema,
    subjectToBlind: object
): BBSPlusBlindedCredentialRequestBuilder {
    const reqBuilder = new BBSPlusBlindedCredentialRequestBuilder();
    reqBuilder.schema = schema;
    reqBuilder.subjectToBlind = subjectToBlind;
    return reqBuilder;
}

// export async function _createOrGetEmailCredentials(
//     _email: string
// ): Promise<CredentialCreateOrGetEmailCredentialsPost200Response> {
//     await maybeInitWasm();
//     const blindedSubject = {
//         secret: "TODO: generate long random 32 bytes",
//     };

//     const schema = secretCredSchema();

//     const reqBuilder = newReqBuilder(schema, blindedSubject);

//     const [_req, _blinding] = reqBuilder.finalize();
// TODO: store blindedSubject and blinding somewhere...
// try {
//     const response = await DefaultApiFactory(
//         undefined,
//         undefined,
//         activeSessionUcanAxios
//     ).credentialCreateOrGetEmailCredentialsPost({
//         email: email,
//         secretBlindedCredentialRequest: JSON.stringify(req.toJSON()),
//     });
//     console.log(response.data);
//     return response.data;
// } catch (e) {
//     console.error(e);
//     throw e;
// }
// }
//

export async function buildBlindedSecretCredential() {
    await maybeInitWasm();
    const secret = base64.encode(randomNumbers({ amount: 32 }));
    const blindedSubject = {
        secret: secret,
    };

    const schema = secretCredSchema();

    const reqBuilder = newReqBuilder(schema, blindedSubject);

    const [req, blinding] = reqBuilder.finalize();
    return { req, blindedSubject, blinding };
}

async function unblindedCredentialFrom(
    secretCredential: SecretCredential,
    userId: string
): Promise<UnblindedSecretCredential> {
    const blindedCredential = BlindedCredential.fromJSON(
        uint8ArrayToJSON(base64.decode(secretCredential.blindedCredential))
    );
    const blindedSubjectBinary = await decodeAndDecrypt(
        secretCredential.encryptedBlindedSubject,
        userId
    );
    const blindedSubject = uint8ArrayToJSON(blindedSubjectBinary);
    const blindingBinary = await decodeAndDecrypt(
        secretCredential.encryptedBlinding,
        userId
    );
    const blinding = Blinding.fromBytes(blindingBinary);
    const unblindedCredential = blindedCredential.toCredential(
        blindedSubject,
        blinding
    );
    return base64.encode(anyToUint8Array(unblindedCredential.toJSON()));
}

export async function unblindedSecretCredentialsPerTypeFrom(
    secretCredentialsPerType: SecretCredentialsPerType,
    userId: string
): Promise<UnblindedSecretCredentialsPerType> {
    await maybeInitWasm();
    const unblindedSecretCredentialsPerType: UnblindedSecretCredentialsPerType =
        {};
    for (const [type, secretCredentials] of Object.entries(
        secretCredentialsPerType
    )) {
        unblindedSecretCredentialsPerType[type] = { revoked: [] };
        for (const secretCredential of secretCredentials.revoked) {
            const unblindedCredential = await unblindedCredentialFrom(
                secretCredential,
                userId
            );
            unblindedSecretCredentialsPerType[type].revoked.push(
                unblindedCredential
            );
        }
        const unblindedActiveCredential =
            secretCredentials.active !== undefined
                ? await unblindedCredentialFrom(
                      secretCredentials.active,
                      userId
                  )
                : undefined;
        unblindedSecretCredentialsPerType[type].active =
            unblindedActiveCredential;
    }
    return unblindedSecretCredentialsPerType;
}

export async function encryptAndEncode(
    data: Uint8Array,
    userId: string
): Promise<string> {
    const symmKey = await cryptoStore.keystore.exportSymmKey(userId);
    const encryptedData = await cryptoStore.aes.encrypt(
        data,
        symmKey,
        DEFAULT_AES_ALG
    );
    return base64.encode(encryptedData);
}

export async function decodeAndDecrypt(
    encodedEncryptedData: string,
    userId: string
): Promise<Uint8Array> {
    const symmKey = await cryptoStore.keystore.exportSymmKey(userId);
    const decodedEncryptedData = base64.decode(encodedEncryptedData);
    const decryptedData = await cryptoStore.aes.decrypt(
        decodedEncryptedData,
        symmKey,
        DEFAULT_AES_ALG
    );
    return decryptedData;
}

/**
 *  May throw exceptions
 * */
export async function decryptEmailCredentials(
    userId: string,
    encryptedSymmKey: string,
    encryptedCredentials: string
): Promise<EmailCredentialsPerEmail> {
    const symmKey = await cryptoStore.keystore.decrypt(
        base64.decode(encryptedSymmKey),
        userId
    );
    const decryptedCredential = await cryptoStore.aes.decrypt(
        base64.decode(encryptedCredentials),
        symmKey,
        DEFAULT_AES_ALG
    );
    const emailCredentialsPerEmailStr = base64.encode(decryptedCredential);
    const emailCredentialsPerEmail: EmailCredentialsPerEmail = {};
    return Object.assign(
        emailCredentialsPerEmail,
        JSON.parse(emailCredentialsPerEmailStr)
    );
}

/**
 *  May throw exceptions
 * */
export async function encryptEmailCredentials(
    userId: string,
    encryptedSymmKey: string,
    emailCredentials: EmailCredentialsPerEmail
): Promise<string> {
    const symmKey = await cryptoStore.keystore.decrypt(
        base64.decode(encryptedSymmKey),
        userId
    );
    const encryptedEmailCredentials = await cryptoStore.aes.encrypt(
        base64.decode(JSON.stringify(emailCredentials)),
        symmKey,
        DEFAULT_AES_ALG
    );
    return base64.encode(encryptedEmailCredentials);
}
