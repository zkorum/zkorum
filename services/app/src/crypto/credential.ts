import { randomNumbers } from "@/crypto/shared";
import { base64 } from "@/shared/common/index";
import {
  BBSPlusBlindedCredentialRequest,
  BBSPlusBlindedCredentialRequestBuilder,
  BBSPlusBlinding,
  CredentialSchema,
  SUBJECT_STR,
} from "@docknetwork/crypto-wasm-ts";

function secretCredSchema() {
  const schema = CredentialSchema.essential();
  schema.properties[SUBJECT_STR] = {
    type: "object",
    properties: {
      uid: { type: "string" },
      type: { type: "string" },
      issuanceDatetime: { type: "string", format: "date-time" },
      secret: { type: "string" },
    },
  };
  return new CredentialSchema(schema);
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

export async function buildBlindedSecretCredential(secret?: string): Promise<PreparedSecretCredentialRequest> {
  let actualSecret = secret;
  if (actualSecret === undefined) {
    actualSecret = base64.encode(randomNumbers({ amount: 32 }));
  }
  const blindedSubject = {
    secret: actualSecret,
  };

  const schema = secretCredSchema();

  const reqBuilder = newReqBuilder(schema, blindedSubject);

  const [req, blinding] = reqBuilder.finalize();
  return { req, blindedSubject, blinding };
}

export interface PreparedSecretCredentialRequest {
  req: BBSPlusBlindedCredentialRequest;
  blindedSubject: {
    secret: string;
  };
  blinding: BBSPlusBlinding;
}

// export async function buildSecretCredentialRequest(
//   symmKey: Uint8Array,
//   secret?: string
// ): Promise<SecretCredentialRequest> {
//   await maybeInitWasm();
//   const { req, blindedSubject, blinding } =
//     await buildBlindedSecretCredential(secret);
//   const blindedSubjectBinary = arrbufs.anyToUint8Array(blindedSubject);
//   const encryptedBlindedSubject = await encryptAndEncodeWithSymmKey(
//     blindedSubjectBinary,
//     symmKey
//   );
//   const encryptedBlinding = await encryptAndEncodeWithSymmKey(
//     blinding.bytes,
//     symmKey
//   );
//   const secretCredentialRequest = {
//     blindedRequest: req.toJSON() as Record<string, unknown>,
//     encryptedEncodedBlindedSubject: encryptedBlindedSubject,
//     encryptedEncodedBlinding: encryptedBlinding,
//   };
//   return secretCredentialRequest;
// }

// export async function isNotSignedByLatestPublicKey(
//   credential: EmailCredential
// ): Promise<boolean> {
//   await maybeInitWasm();
//   if (process.env.BACK_PUBLIC_KEY === undefined) {
//     console.warn("Backend public key unknown");
//     return false
//   }
//   const publicKey = BBSPlusPublicKeyG2.fromHex(process.env.BACK_PUBLIC_KEY);
//   const credObj = BBSPlusCredential.fromJSON(
//     uint8ArrayToJSON(base64.decode(credential))
//   );
//   const result = credObj.verify(publicKey as BBSPlusPublicKeyG2);
//   return !result.verified;
// }

// export async function isSecretNotSignedByLatestPublicKey(
//   credential: SecretCredential,
//   userId: string
// ): Promise<boolean> {
//   await maybeInitWasm();
//   if (process.env.BACK_PUBLIC_KEY === undefined) {
//     console.warn("Backend public key unknown");
//     return false
//   }
//   const publicKey = BBSPlusPublicKeyG2.fromHex(process.env.BACK_PUBLIC_KEY);
//   const unblindedCredential = await decodedUnblindedCredentialFrom(
//     credential as SecretCredential,
//     userId
//   );
//   const result = unblindedCredential.verify(publicKey as BBSPlusPublicKeyG2);
//   return !result.verified;
// }
//
// export async function getSecretFromSecretCredential(
//   secretCredential: SecretCredential,
//   userId: string
// ): Promise<string> {
//   await maybeInitWasm();
//   const unblindedCredential = await decodedUnblindedCredentialFrom(
//     secretCredential,
//     userId
//   );
//   //TODO make this type-safe
//   return (unblindedCredential.subject as any).secret;
// }

// async function decodedUnblindedCredentialFrom(
//   secretCredential: SecretCredential,
//   userId: string
// ): Promise<BBSPlusCredential> {
//   const blindedCredential = BlindedCredential.fromJSON(
//     uint8ArrayToJSON(base64.decode(secretCredential.blindedCredential))
//   );
//   const blindedSubjectBinary = await decodeAndDecrypt(
//     secretCredential.encryptedBlindedSubject,
//     userId
//   );
//   const blindedSubject = uint8ArrayToJSON(blindedSubjectBinary);
//   const blindingBinary = await decodeAndDecrypt(
//     secretCredential.encryptedBlinding,
//     userId
//   );
//   const blinding = Blinding.fromBytes(blindingBinary);
//   const unblindedCredential = blindedCredential.toCredential(
//     blindedSubject,
//     blinding
//   );
//   return unblindedCredential;
// }

// export async function unblindedCredentialFrom(
//   secretCredential: SecretCredential,
//   userId: string
// ): Promise<UnblindedSecretCredential> {
//   const blindedCredential = BlindedCredential.fromJSON(
//     uint8ArrayToJSON(base64.decode(secretCredential.blindedCredential))
//   );
//   const blindedSubjectBinary = await decodeAndDecrypt(
//     secretCredential.encryptedBlindedSubject,
//     userId
//   );
//   const blindedSubject = uint8ArrayToJSON(blindedSubjectBinary);
//   const blindingBinary = await decodeAndDecrypt(
//     secretCredential.encryptedBlinding,
//     userId
//   );
//   const blinding = Blinding.fromBytes(blindingBinary);
//   const unblindedCredential = blindedCredential.toCredential(
//     blindedSubject,
//     blinding
//   );
//   return base64.encode(anyToUint8Array(unblindedCredential.toJSON()));
// }

// export async function unblindedSecretCredentialsPerTypeFrom(
//   secretCredentialsPerType: SecretCredentialsPerType,
//   userId: string
// ): Promise<UnblindedSecretCredentialsPerType> {
//   await maybeInitWasm();
//   const unblindedSecretCredentialsPerType: UnblindedSecretCredentialsPerType =
//     {};
//   for (const [type, secretCredentials] of Object.entries(
//     secretCredentialsPerType
//   )) {
//     unblindedSecretCredentialsPerType[type as SecretCredentialType] = {
//       revoked: [],
//     };
//     for (const secretCredential of secretCredentials.revoked) {
//       try {
//         const unblindedCredential = await unblindedCredentialFrom(
//           secretCredential,
//           userId
//         );
//         (
//           unblindedSecretCredentialsPerType[
//           type as SecretCredentialType
//           ] as UnblindedSecretCredentials
//         ).revoked.push(unblindedCredential);
//       } catch (e) {
//         console.log(
//           "Credential secret was lost - skipping trying to unblind it"
//         );
//         continue;
//       }
//     }
//     try {
//       const unblindedActiveCredential =
//         secretCredentials.active !== undefined
//           ? await unblindedCredentialFrom(
//             secretCredentials.active,
//             userId
//           )
//           : undefined;
//       (
//         unblindedSecretCredentialsPerType[
//         type as SecretCredentialType
//         ] as UnblindedSecretCredentials
//       ).active = unblindedActiveCredential;
//     } catch (e) {
//       console.log(
//         "Credential secret was lost - skipping trying to unblind it"
//       );
//       continue;
//     }
//   }
//   return unblindedSecretCredentialsPerType;
// }

// export async function encryptAndEncodeWithSymmKey(
//   data: Uint8Array,
//   symmKey: Uint8Array
// ): Promise<string> {
//   const cryptoStore = await getCryptoStore();
//   const encryptedData = await cryptoStore.aes.encrypt(
//     data,
//     symmKey,
//     DEFAULT_AES_ALG
//   );
//   return base64.encode(encryptedData);
// }
//
// export async function encryptAndEncode(
//   data: Uint8Array,
//   userId: string
// ): Promise<string> {
//   const cryptoStore = await getCryptoStore();
//   const symmKey = await cryptoStore.keystore.exportSymmKey(userId);
//   const encryptedData = await cryptoStore.aes.encrypt(
//     data,
//     symmKey,
//     DEFAULT_AES_ALG
//   );
//   return base64.encode(encryptedData);
// }
//
// export async function decodeAndDecrypt(
//   encodedEncryptedData: string,
//   userId: string
// ): Promise<Uint8Array> {
//   const cryptoStore = await getCryptoStore();
//   const symmKey = await cryptoStore.keystore.exportSymmKey(userId);
//   const decodedEncryptedData = base64.decode(encodedEncryptedData);
//   const decryptedData = await cryptoStore.aes.decrypt(
//     decodedEncryptedData,
//     symmKey,
//     DEFAULT_AES_ALG
//   );
//   return decryptedData;
// }
//
// /**
//  *  May throw exceptions
//  * */
// export async function decryptEmailCredentials(
//   userId: string,
//   encryptedSymmKey: string,
//   encryptedCredentials: string
// ): Promise<EmailCredentialsPerEmail> {
//   const cryptoStore = await getCryptoStore();
//   const symmKey = await cryptoStore.keystore.decrypt(
//     base64.decode(encryptedSymmKey),
//     userId
//   );
//   const decryptedCredential = await cryptoStore.aes.decrypt(
//     base64.decode(encryptedCredentials),
//     symmKey,
//     DEFAULT_AES_ALG
//   );
//   const emailCredentialsPerEmailStr = base64.encode(decryptedCredential);
//   const emailCredentialsPerEmail: EmailCredentialsPerEmail = {};
//   return Object.assign(
//     emailCredentialsPerEmail,
//     JSON.parse(emailCredentialsPerEmailStr)
//   );
// }
//
// /**
//  *  May throw exceptions
//  * */
// export async function encryptEmailCredentials(
//   userId: string,
//   encryptedSymmKey: string,
//   emailCredentials: EmailCredentialsPerEmail
// ): Promise<string> {
//   const cryptoStore = await getCryptoStore();
//   const symmKey = await cryptoStore.keystore.decrypt(
//     base64.decode(encryptedSymmKey),
//     userId
//   );
//   const encryptedEmailCredentials = await cryptoStore.aes.encrypt(
//     base64.decode(JSON.stringify(emailCredentials)),
//     symmKey,
//     DEFAULT_AES_ALG
//   );
//   return base64.encode(encryptedEmailCredentials);
// }
