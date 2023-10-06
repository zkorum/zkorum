// import {
//     BBSPlusBlindedCredentialRequestBuilder,
//     CredentialSchema,
//     initializeWasm,
//     SUBJECT_STR,
// } from "@docknetwork/crypto-wasm-ts";
import { DefaultApiFactory, type CredentialsGetPost200Response } from "@/api";
import { activeSessionUcanAxios } from "@/interceptors";

// let WASM_INITIALIZED = false;

// function secretCredSchema() {
//     const schema = CredentialSchema.essential();
//     schema.properties[SUBJECT_STR] = {
//         type: "object",
//         properties: {
//             email: { type: "string" },
//             secret: { type: "string" },
//         },
//     };
//     return new CredentialSchema(schema);
// }

// TODO: move this function once and for all at React app initialization stage
// async function maybeInitWasm() {
//     if (WASM_INITIALIZED) {
//         return;
//     } else {
//         await initializeWasm();
//         WASM_INITIALIZED = true;
//     }
// }

// function newReqBuilder(
//     schema: CredentialSchema,
//     subjectToBlind: object
// ): BBSPlusBlindedCredentialRequestBuilder {
//     const reqBuilder = new BBSPlusBlindedCredentialRequestBuilder();
//     reqBuilder.schema = schema;
//     reqBuilder.subjectToBlind = subjectToBlind;
//     return reqBuilder;
// }

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

export async function getCredentials(): Promise<CredentialsGetPost200Response> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).credentialsGetPost();
    return response.data;
}
