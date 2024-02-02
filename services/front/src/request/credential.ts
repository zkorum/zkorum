import { DefaultApiFactory } from "@/api";
import { retrieveSymmKey } from "@/crypto/ucan/ucan";
import {
    buildSecretCredentialRequest,
    getSecretFromSecretCredential,
    isNotSignedByLatestPublicKey,
    isSecretNotSignedByLatestPublicKey,
    unblindedSecretCredentialsPerTypeFrom,
} from "@/crypto/vc/credential";
import { activeSessionUcanAxios } from "@/interceptors";
import { updateCredentials } from "@/store/reducers/session";
import { store } from "@/store/store";

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
        store.dispatch(
            updateCredentials({
                emailCredentialsPerEmail: credentials.emailCredentialsPerEmail,
                unblindedSecretCredentialsPerType:
                    await unblindedSecretCredentialsPerTypeFrom(
                        credentials.secretCredentialsPerType,
                        userId
                    ),
            })
        );
    }
}
