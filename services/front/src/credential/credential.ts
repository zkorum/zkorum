import {
    BBSPlusBlindedCredentialRequestBuilder,
    CredentialSchema,
    initializeWasm,
    isWasmInitialized,
    SUBJECT_STR,
} from "@docknetwork/crypto-wasm-ts";
import {
    DefaultApiFactory,
    type CredentialRequestPostRequestEmailCredentialRequest,
} from "@/api";
import { activeSessionUcanAxios } from "@/interceptors";
import type { EmailCredentialRequest } from "@/shared/types/zod";
import { updateCredentials } from "@/store/reducers/session";
import { store } from "@/store/store";
import { randomNumbers } from "@/crypto/ucan/implementation/browser";
import { encode } from "@/shared/common/base64";
import { arrbufs } from "@/shared/common";
import { encryptAndEncode } from "@/crypto/vc/credential";

function secretCredSchema() {
    const schema = CredentialSchema.essential();
    schema.properties[SUBJECT_STR] = {
        type: "object",
        properties: {
            userId: { type: "string" },
            type: { type: "string" },
            secret: { type: "string" },
        },
    };
    return new CredentialSchema(schema);
}

// TODO: move this function once and for all at React app initialization stage
async function maybeInitWasm() {
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
    const secret = encode(randomNumbers({ amount: 32 }));
    const blindedSubject = {
        secret: secret,
    };

    const schema = secretCredSchema();

    const reqBuilder = newReqBuilder(schema, blindedSubject);

    const [req, blinding] = reqBuilder.finalize();
    return { req, blindedSubject, blinding };
}

export async function requestAnonymousCredentials(
    email: string,
    emailCredentialRequest: EmailCredentialRequest,
    userId: string
): Promise<void> {
    const { req, blindedSubject, blinding } =
        await buildBlindedSecretCredential();
    const blindedSubjectBinary = arrbufs.anyToUint8Array(blindedSubject);
    const encryptedBlindedSubject = await encryptAndEncode(
        blindedSubjectBinary,
        userId
    );
    const encryptedBlinding = await encryptAndEncode(blinding.value, userId);
    const secretCredentialRequest = {
        blindedRequest: req.toJSON(),
        encryptedEncodedBlindedSubject: encryptedBlindedSubject,
        encryptedEncodedBlinding: encryptedBlinding,
    };
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).credentialRequestPost({
        email: email,
        emailCredentialRequest:
            emailCredentialRequest as CredentialRequestPostRequestEmailCredentialRequest,
        secretCredentialRequest: secretCredentialRequest,
    });
    if (response.data !== undefined) {
        const credentials = response.data;
        store.dispatch(
            updateCredentials({
                emailCredentialsPerEmail: credentials.emailCredentialsPerEmail,
                secretCredentialsPerType: credentials.secretCredentialsPerType,
            })
        );
    } else {
        console.warn("Unexpected empty data on credential request response");
    }
}

// TODO this function is subject to synchronization errors,
// because the activeSessionEmail email is continuously
// fetched in the cache, instead of being passed as param.
// This could lead to situation where someone else's credential
// is stored in the active session email
export async function fetchAndUpdateCredentials(): Promise<void> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).credentialGetPost();
    const credentials = response?.data;
    if (credentials !== undefined) {
        store.dispatch(
            updateCredentials({
                emailCredentialsPerEmail: credentials.emailCredentialsPerEmail,
                secretCredentialsPerType: credentials.secretCredentialsPerType,
            })
        );
    }
}
