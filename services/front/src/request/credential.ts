import {
    DefaultApiFactory,
    type ApiV1CredentialFormRequestPostRequestFormCredentialRequest,
    type ApiV1PollCreatePostRequestPoll,
} from "@/api";
import { retrieveSymmKey } from "@/crypto/ucan/ucan";
import {
    buildSecretCredentialRequest,
    getSecretFromSecretCredential,
    isNotSignedByLatestPublicKey,
    isSecretNotSignedByLatestPublicKey,
    unblindedSecretCredentialsPerTypeFrom,
} from "@/crypto/vc/credential";
import { activeSessionUcanAxios, noAuthAxios } from "@/interceptors";
import type {
    FormCredentialRequest,
    ResponseToPollPayload,
} from "@/shared/types/zod";
import {
    insertOrUpdateResponseToPoll,
    updateCredentials,
    updateFormCredentials,
} from "@/store/reducers/session";
import { store } from "@/store/store";
import { type Presentation } from "@docknetwork/crypto-wasm-ts";

export async function requestAnonymousCredentials(
    email: string,
    formCredentialRequest: FormCredentialRequest
): Promise<void> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1CredentialFormRequestPost({
        email: email,
        formCredentialRequest:
            formCredentialRequest as ApiV1CredentialFormRequestPostRequestFormCredentialRequest,
    });
    if (response.data !== undefined) {
        const credentials = response.data;
        store.dispatch(
            updateFormCredentials({
                formCredentialsPerEmail: credentials.formCredentialsPerEmail,
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
export async function fetchAndUpdateCredentials(
    userId: string,
    email: string
): Promise<void> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1CredentialGetPost();
    const credentials = response?.data;
    if (credentials !== undefined) {
        if (
            credentials.secretCredentialsPerType.timebound.active === undefined
        ) {
            // request new blinded credential
            const numberOfRevokedTimeboundSecretCred =
                credentials.secretCredentialsPerType.timebound.revoked.length;
            const lastRevokedTimeboundSecretCred =
                credentials.secretCredentialsPerType.timebound.revoked[
                    numberOfRevokedTimeboundSecretCred - 1
                ];
            if (
                await isSecretNotSignedByLatestPublicKey(
                    lastRevokedTimeboundSecretCred,
                    userId
                )
            ) {
                const secret = await getSecretFromSecretCredential(
                    lastRevokedTimeboundSecretCred,
                    userId
                );
                const symmKey = await retrieveSymmKey(userId);
                const timeboundSecretCredentialRequest =
                    await buildSecretCredentialRequest(symmKey, secret);
                const response = await DefaultApiFactory(
                    undefined,
                    undefined,
                    activeSessionUcanAxios
                ).apiV1CredentialSecretRenewPost({
                    secretCredentialRequest: timeboundSecretCredentialRequest,
                    type: "timebound",
                });
                if (response?.data !== undefined) {
                    credentials.secretCredentialsPerType.timebound.active = {
                        blindedCredential:
                            response.data.signedBlindedCredential,
                        encryptedBlinding:
                            timeboundSecretCredentialRequest.encryptedEncodedBlinding,
                        encryptedBlindedSubject:
                            timeboundSecretCredentialRequest.encryptedEncodedBlindedSubject,
                    };
                }
            }
            // Else, user is suspended!
        }
        if (credentials.secretCredentialsPerType.unbound.active === undefined) {
            // request new blinded credential
            const numberOfRevokedUnboundSecretCred =
                credentials.secretCredentialsPerType.unbound.revoked.length;
            const lastRevokedUnboundSecretCred =
                credentials.secretCredentialsPerType.unbound.revoked[
                    numberOfRevokedUnboundSecretCred - 1
                ];
            if (
                await isSecretNotSignedByLatestPublicKey(
                    lastRevokedUnboundSecretCred,
                    userId
                )
            ) {
                const secret = await getSecretFromSecretCredential(
                    lastRevokedUnboundSecretCred,
                    userId
                );
                const symmKey = await retrieveSymmKey(userId);
                const unboundSecretCredentialRequest =
                    await buildSecretCredentialRequest(symmKey, secret);
                const response = await DefaultApiFactory(
                    undefined,
                    undefined,
                    activeSessionUcanAxios
                ).apiV1CredentialSecretRenewPost({
                    secretCredentialRequest: unboundSecretCredentialRequest,
                    type: "unbound",
                });
                if (response?.data !== undefined) {
                    credentials.secretCredentialsPerType.unbound.active = {
                        blindedCredential:
                            response.data.signedBlindedCredential,
                        encryptedBlinding:
                            unboundSecretCredentialRequest.encryptedEncodedBlinding,
                        encryptedBlindedSubject:
                            unboundSecretCredentialRequest.encryptedEncodedBlindedSubject,
                    };
                }
            }
            // Else, user is suspended!
        }
        if (
            credentials.emailCredentialsPerEmail[email] !== undefined &&
            credentials.emailCredentialsPerEmail[email].active === undefined
        ) {
            const emailCredentials =
                credentials.emailCredentialsPerEmail[email];
            const numberOfRevokedCred = emailCredentials.revoked.length;
            const lastRevokedCred =
                emailCredentials.revoked[numberOfRevokedCred - 1];
            if (await isNotSignedByLatestPublicKey(lastRevokedCred)) {
                const response = await DefaultApiFactory(
                    undefined,
                    undefined,
                    activeSessionUcanAxios
                ).apiV1CredentialEmailRenewPost({
                    email: email,
                });
                if (response?.data !== undefined) {
                    credentials.emailCredentialsPerEmail[email].active =
                        response.data.emailCredential;
                }
            }
            // Else, user is suspended!
        }
        if (
            credentials.formCredentialsPerEmail[email] !== undefined &&
            credentials.formCredentialsPerEmail[email].active === undefined &&
            credentials.formCredentialsPerEmail[email].revoked.length !== 0
        ) {
            const formCredentials = credentials.formCredentialsPerEmail[email];
            const numberOfRevokedCred = formCredentials.revoked.length;
            const lastRevokedCred =
                formCredentials.revoked[numberOfRevokedCred - 1];
            if (await isNotSignedByLatestPublicKey(lastRevokedCred)) {
                const response = await DefaultApiFactory(
                    undefined,
                    undefined,
                    activeSessionUcanAxios
                ).apiV1CredentialFormRenewPost({
                    email: email,
                });
                if (response?.data !== undefined) {
                    credentials.formCredentialsPerEmail[email].active =
                        response.data.formCredential;
                }
            }
            // Else, user is suspended!
        }
        store.dispatch(
            updateCredentials({
                emailCredentialsPerEmail: credentials.emailCredentialsPerEmail,
                formCredentialsPerEmail: credentials.formCredentialsPerEmail,
                unblindedSecretCredentialsPerType:
                    await unblindedSecretCredentialsPerTypeFrom(
                        credentials.secretCredentialsPerType,
                        userId
                    ),
            })
        );
    }
}

export async function createPoll(
    presentation: Presentation,
    pollContent: ApiV1PollCreatePostRequestPoll
): Promise<void> {
    // const bearerToken = encodeCbor(presentation.toJSON());
    // console.log(
    //     presentation.toJSON(),
    //     bearerToken,
    //     new Blob([bearerToken]).size
    // );
    await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1PollCreatePost({
        poll: pollContent,
        pres: presentation.toJSON(),
    });
}

export async function doRespondToPoll(
    presentation: Presentation,
    responseToPoll: ResponseToPollPayload,
    updatePost: (responseToPoll: ResponseToPollPayload) => void
): Promise<void> {
    const generatedPseudonym =
        presentation.spec.boundedPseudonyms === undefined
            ? undefined
            : Object.keys(presentation.spec.boundedPseudonyms)[0];
    if (generatedPseudonym === undefined) {
        throw new Error("Pseudonym was not generated in the proof");
    }
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        noAuthAxios
    ).apiV1PollRespondPost({
        responseToPoll: responseToPoll,
        pres: presentation.toJSON(),
    });
    if (response.status >= 200 && response.status <= 299) {
        // update local DB with the presentation
        store.dispatch(
            insertOrUpdateResponseToPoll({
                respondentPseudonym: generatedPseudonym,
                responsePayload: responseToPoll,
            })
        );
        updatePost(responseToPoll);
    }
}
