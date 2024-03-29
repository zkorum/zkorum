import { getCryptoStore, store } from "../store/store";
import {
    verifying,
    authenticating,
    loggedOut,
    loggedIn,
    switchActiveSession,
    type SessionData,
    openAuthModal,
    awaitingSyncingLoggedOut,
    closeAuthModal,
    resetPendingSession,
} from "../store/reducers/session";
import * as DID from "../crypto/ucan/did/index";
import {
    DefaultApiFactory,
    type ApiV1AuthAuthenticatePost200Response,
    type ApiV1AuthVerifyOtpPost200Response,
    ApiV1AuthVerifyOtpPost200ResponseReasonEnum,
    type ApiV1AuthAuthenticatePost409Response,
    type ApiV1AuthAuthenticatePost409ResponseAnyOf,
} from "../api/api";
import {
    activeSessionUcanAxios,
    createAxiosPerEmail,
    pendingSessionUcanAxios,
} from "../interceptors";
import axios from "axios";
import { showError, showSuccess } from "../store/reducers/snackbar";
import {
    authSuccess,
    genericError,
    throttled,
} from "../components/error/message";
import { closeMainLoading, openMainLoading } from "../store/reducers/loading";
import {
    copyKeypairs,
    generateAndEncryptSymmKey,
    storeSymmKeyLocally,
} from "@/crypto/ucan/ucan";
import type {
    Devices,
    EmailCredentialsPerEmail,
    SecretCredentialRequest,
    SecretCredentialsPerType,
} from "@/shared/types/zod";
import {
    buildSecretCredentialRequest,
    unblindedSecretCredentialsPerTypeFrom,
} from "@/crypto/vc/credential";

export async function authenticate(
    email: string,
    isRequestingNewCode: boolean,
    userId?: string
): Promise<
    | ApiV1AuthAuthenticatePost200Response
    | "logged-in"
    | "awaiting-syncing"
    | "throttled"
> {
    let didExchange: string;
    const cryptoStore = await getCryptoStore();
    if (userId !== undefined) {
        const exchangeKeyExists =
            await cryptoStore.keystore.exchangeKeyExists(userId);
        if (exchangeKeyExists) {
            didExchange = await DID.exchange(cryptoStore, userId);
        } else {
            console.warn("UserId did not fetch any exchange key");
            await cryptoStore.keystore.createIfDoesNotExists(email);
            didExchange = await DID.exchange(cryptoStore, email);
        }
    } else {
        await cryptoStore.keystore.createIfDoesNotExists(email);
        didExchange = await DID.exchange(cryptoStore, email);
    }

    // this is a necessary step for interceptor to inject UCAN
    store.dispatch(authenticating({ email: email, userId: userId }));

    // Send authenticate request - UCAN will be sent by interceptor
    try {
        const otpDetails = await DefaultApiFactory(
            undefined,
            undefined,
            pendingSessionUcanAxios
        ).apiV1AuthAuthenticatePost({
            email: email,
            didExchange: didExchange,
            isRequestingNewCode: isRequestingNewCode,
        });
        store.dispatch(
            verifying({
                email: email,
                userId: userId,
                codeExpiry: otpDetails.data.codeExpiry,
                nextCodeSoonestTime: otpDetails.data.nextCodeSoonestTime,
            })
        );
        return otpDetails.data;
    } catch (e) {
        if (axios.isAxiosError(e)) {
            if (e.response?.status === 409) {
                const auth409:
                    | ApiV1AuthAuthenticatePost409Response
                    | ApiV1AuthAuthenticatePost409ResponseAnyOf = e.response
                    .data as
                    | ApiV1AuthAuthenticatePost409Response
                    | ApiV1AuthAuthenticatePost409ResponseAnyOf; // TODO: this is not future proof - openapi type generation isn't right
                switch (auth409.reason) {
                    case "already_logged_in":
                        await onLoggedIn({
                            email: email,
                            userId: auth409.userId,
                            sessionExpiry: auth409.sessionExpiry,
                            isRegistration: false,
                            encryptedSymmKey: auth409.encryptedSymmKey,
                            syncingDevices: auth409.syncingDevices,
                            emailCredentialsPerEmail:
                                auth409.emailCredentialsPerEmail,
                            secretCredentialsPerType:
                                auth409.secretCredentialsPerType,
                        });
                        return "logged-in";
                    case "awaiting_syncing":
                        await onAwaitingSyncing({
                            email: email,
                            userId: auth409.userId,
                            sessionExpiry: auth409.sessionExpiry,
                            syncingDevices: auth409.syncingDevices,
                        });
                        return "awaiting-syncing";
                }
            } else if (e.response?.status === 429) {
                return "throttled";
            } else {
                throw e;
            }
        } else {
            throw e;
        }
    }
}

interface VerifyOtpResult {
    verifyOtpData: ApiV1AuthVerifyOtpPost200Response;
    tempEncryptedSymmKey: string | undefined;
}

export async function verifyOtp(
    code: number,
    pendingEmail: string,
    userId?: string
): Promise<VerifyOtpResult> {
    let unboundSecretCredentialRequest: SecretCredentialRequest | undefined =
        undefined;
    let timeboundSecretCredentialRequest: SecretCredentialRequest | undefined =
        undefined;
    let tempEncryptedSymmKey: string | undefined = undefined;
    let tempExportedSymmKey: Uint8Array | undefined = undefined;
    if (userId === undefined) {
        const { exportedSymmKey, encodedEncryptedSymmKey } =
            await generateAndEncryptSymmKey(pendingEmail);
        tempEncryptedSymmKey = encodedEncryptedSymmKey;
        tempExportedSymmKey = exportedSymmKey;
        unboundSecretCredentialRequest =
            await buildSecretCredentialRequest(tempExportedSymmKey);
        timeboundSecretCredentialRequest =
            await buildSecretCredentialRequest(tempExportedSymmKey);
    }
    let verifyOtpResult = await DefaultApiFactory(
        undefined,
        undefined,
        pendingSessionUcanAxios
    ).apiV1AuthVerifyOtpPost({
        code: code,
        encryptedSymmKey: tempEncryptedSymmKey,
        unboundSecretCredentialRequest: unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest: timeboundSecretCredentialRequest,
    });
    if (
        verifyOtpResult.data.success === false &&
        (verifyOtpResult.data.reason ===
            ApiV1AuthVerifyOtpPost200ResponseReasonEnum.SecretCredentialRequestsRequired ||
            verifyOtpResult.data.reason ===
                ApiV1AuthVerifyOtpPost200ResponseReasonEnum.UnboundSecretCredentialRequestRequired ||
            verifyOtpResult.data.reason ===
                ApiV1AuthVerifyOtpPost200ResponseReasonEnum.TimeboundSecretCredentialRequestRequired ||
            verifyOtpResult.data.reason ===
                ApiV1AuthVerifyOtpPost200ResponseReasonEnum.EncryptedSymmKeyRequired)
    ) {
        const { exportedSymmKey, encodedEncryptedSymmKey } =
            await generateAndEncryptSymmKey(pendingEmail);
        tempEncryptedSymmKey = encodedEncryptedSymmKey;
        tempExportedSymmKey = exportedSymmKey;
        unboundSecretCredentialRequest =
            await buildSecretCredentialRequest(tempExportedSymmKey);
        timeboundSecretCredentialRequest =
            await buildSecretCredentialRequest(tempExportedSymmKey);
        verifyOtpResult = await DefaultApiFactory(
            undefined,
            undefined,
            pendingSessionUcanAxios
        ).apiV1AuthVerifyOtpPost({
            code: code,
            encryptedSymmKey: tempEncryptedSymmKey,
            unboundSecretCredentialRequest: unboundSecretCredentialRequest,
            timeboundSecretCredentialRequest: timeboundSecretCredentialRequest,
        });
    }
    return { verifyOtpData: verifyOtpResult.data, tempEncryptedSymmKey };
}

export async function logout() {
    const activeSessionEmail = store.getState().sessions.activeSessionEmail;
    await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    ).apiV1AuthLogoutPost();
    store.dispatch(loggedOut({ email: activeSessionEmail }));
}

export async function awaitingSyncingLogout(email: string) {
    await DefaultApiFactory(
        undefined,
        undefined,
        createAxiosPerEmail(email)
    ).apiV1AuthLogoutPost();
    store.dispatch(awaitingSyncingLoggedOut({ email: email }));
}

export function handleOnAuthenticate(email: string, userId?: string) {
    store.dispatch(openMainLoading());
    // do register the user
    authenticate(email, false, userId)
        .then((response) => {
            if (response === "logged-in") {
                store.dispatch(showSuccess(authSuccess));
            } else if (response === "awaiting-syncing") {
                // TODO
            } else if (response === "throttled") {
                store.dispatch(showError(throttled));
            }
            // else go to next step => validate email address => automatic via redux store update
        })
        .catch((e) => {
            console.error(e);
            store.dispatch(showError(genericError));
        })
        .finally(() => {
            store.dispatch(closeMainLoading());
        });
}

export function handleSwitchActiveSession(email: string) {
    store.dispatch(switchActiveSession({ email: email }));
    store.dispatch(showSuccess(`Switched active session to ${email}`));
}

export async function onChooseAccount(session: SessionData): Promise<void> {
    if (session.status === "logged-in") {
        handleSwitchActiveSession(session.email);
    } else {
        handleOnAuthenticate(session.email, session.userId);
    }
}

interface OnLoggedInProps {
    email: string;
    userId: string;
    sessionExpiry: string;
    encryptedSymmKey: string;
    isRegistration: boolean;
    syncingDevices: Devices; // adapts the welcome page if there is only one device in that list
    emailCredentialsPerEmail: EmailCredentialsPerEmail;
    secretCredentialsPerType: SecretCredentialsPerType;
}

interface OnSyncingProps {
    email: string;
    userId: string;
    sessionExpiry: string;
    syncingDevices: Devices;
}

export async function onLoggedIn({
    email,
    userId,
    sessionExpiry,
    encryptedSymmKey,
    isRegistration,
    syncingDevices, // adapts the welcome page if there is only one device in that list
    emailCredentialsPerEmail,
    secretCredentialsPerType,
}: OnLoggedInProps) {
    // this is a first time registration or a login from a known device that's been synced already
    await copyKeypairs(email, userId);
    // TODO: what to do what the symm key cannot be deciphered? we ignore this range of problems for now.
    // current design should not allow it.
    // we also ignore the potential I/O error from storing the key. This should be dealt with by re-trying.
    await storeSymmKeyLocally(encryptedSymmKey, userId);

    if (!isRegistration) {
        store.dispatch(closeAuthModal());
        store.dispatch(resetPendingSession());
    }

    store.dispatch(
        loggedIn({
            email: email,
            userId: userId,
            sessionExpiry: sessionExpiry,
            encryptedSymmKey: encryptedSymmKey,
            isRegistration: isRegistration,
            syncingDevices: syncingDevices, // adapts the welcome page if there is only one device in that list
            emailCredentialsPerEmail: emailCredentialsPerEmail,
            unblindedSecretCredentialsPerType:
                await unblindedSecretCredentialsPerTypeFrom(
                    secretCredentialsPerType,
                    userId
                ),
        })
    );
}

export async function onAwaitingSyncing({ email, userId }: OnSyncingProps) {
    // this is a first time registration or a login from a known device that's been synced already
    await copyKeypairs(email, userId);

    await recoverAccount();
}

export function redirectToLogin() {
    store.dispatch(openAuthModal());
}

export async function recoverAccount() {
    const pendingSessionEmail = store.getState().sessions.pendingSessionEmail;
    const { exportedSymmKey, encodedEncryptedSymmKey } =
        await generateAndEncryptSymmKey(pendingSessionEmail);
    const unboundSecretCredentialRequest =
        await buildSecretCredentialRequest(exportedSymmKey);
    const timeboundSecretCredentialRequest =
        await buildSecretCredentialRequest(exportedSymmKey);
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        pendingSessionUcanAxios
    ).apiV1AuthRecoverPost({
        encryptedSymmKey: encodedEncryptedSymmKey,
        unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest,
    });
    const recoverAccountResp = response?.data;
    if (recoverAccountResp !== undefined) {
        await onLoggedIn({
            email: pendingSessionEmail,
            userId: recoverAccountResp.userId,
            sessionExpiry: recoverAccountResp.sessionExpiry,
            encryptedSymmKey: encodedEncryptedSymmKey,
            isRegistration: false,
            syncingDevices: recoverAccountResp.syncingDevices,
            emailCredentialsPerEmail:
                recoverAccountResp.emailCredentialsPerEmail,
            secretCredentialsPerType:
                recoverAccountResp.secretCredentialsPerType,
        });
    }
}
