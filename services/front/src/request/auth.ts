import { cryptoStore, store } from "../store/store";
import {
    verifying,
    authenticating,
    loggedOut,
    loggedIn,
    switchActiveSession,
    type SessionData,
    openAuthModal,
} from "../store/reducers/session";
import * as DID from "../crypto/ucan/did/index";
import {
    DefaultApiFactory,
    type AuthAuthenticatePost200Response,
    type AuthVerifyOtpPost200Response,
    type AuthAuthenticatePost409Response,
    AuthVerifyOtpPost200ResponseReasonEnum,
} from "../api/api";
import {
    activeSessionUcanAxios,
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
    copyKeypairsIfDestIsEmpty,
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
    | AuthAuthenticatePost200Response
    | "logged-in"
    | "awaiting-syncing"
    | "throttled"
> {
    let didExchange: string;
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
        ).authAuthenticatePost({
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
                const auth409: AuthAuthenticatePost409Response = e.response
                    .data as AuthAuthenticatePost409Response;
                if (auth409.reason === "already_logged_in") {
                    await onLoggedIn({
                        email: email,
                        userId: auth409.userId,
                        isRegistration: false,
                        encryptedSymmKey: auth409.encryptedSymmKey,
                        syncingDevices: auth409.syncingDevices,
                        emailCredentialsPerEmail:
                            auth409.emailCredentialsPerEmail,
                        formCredentialsPerEmail:
                            auth409.formCredentialsPerEmail,
                        secretCredentialsPerType:
                            auth409.secretCredentialsPerType,
                    });
                    return "logged-in";
                } else {
                    // TODO
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
    verifyOtpData: AuthVerifyOtpPost200Response;
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
    ).authVerifyOtpPost({
        code: code,
        encryptedSymmKey: tempEncryptedSymmKey,
        unboundSecretCredentialRequest: unboundSecretCredentialRequest,
        timeboundSecretCredentialRequest: timeboundSecretCredentialRequest,
    });
    if (
        verifyOtpResult.data.success === false &&
        (verifyOtpResult.data.reason ===
            AuthVerifyOtpPost200ResponseReasonEnum.SecretCredentialRequestsRequired ||
            verifyOtpResult.data.reason ===
                AuthVerifyOtpPost200ResponseReasonEnum.UnboundSecretCredentialRequestRequired ||
            verifyOtpResult.data.reason ===
                AuthVerifyOtpPost200ResponseReasonEnum.TimeboundSecretCredentialRequestRequired ||
            verifyOtpResult.data.reason ===
                AuthVerifyOtpPost200ResponseReasonEnum.EncryptedSymmKeyRequired)
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
        ).authVerifyOtpPost({
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
    ).authLogoutPost();
    store.dispatch(loggedOut({ email: activeSessionEmail }));
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
    encryptedSymmKey: string;
    isRegistration: boolean;
    syncingDevices: Devices; // adapts the welcome page if there is only one device in that list
    emailCredentialsPerEmail: EmailCredentialsPerEmail;
    formCredentialsPerEmail: EmailCredentialsPerEmail; // adapts the welcome page whether it is empty or not
    secretCredentialsPerType: SecretCredentialsPerType;
}

export async function onLoggedIn({
    email,
    userId,
    encryptedSymmKey,
    isRegistration,
    syncingDevices, // adapts the welcome page if there is only one device in that list
    emailCredentialsPerEmail,
    formCredentialsPerEmail, // adapts the welcome page whether it is empty or not
    secretCredentialsPerType,
}: OnLoggedInProps) {
    // this is a first time registration or a login from a known device that's been synced already
    await copyKeypairsIfDestIsEmpty(email, userId);
    // TODO: what to do what the symm key cannot be deciphered? we ignore this range of problems for now.
    // current design should not allow it.
    // we also ignore the potential I/O error from storing the key. This should be dealt with by re-trying.
    await storeSymmKeyLocally(encryptedSymmKey, userId);

    store.dispatch(
        loggedIn({
            email: email,
            userId: userId,
            encryptedSymmKey: encryptedSymmKey,
            isRegistration: isRegistration,
            syncingDevices: syncingDevices, // adapts the welcome page if there is only one device in that list
            emailCredentialsPerEmail: emailCredentialsPerEmail,
            formCredentialsPerEmail: formCredentialsPerEmail, // adapts the welcome page whether it is empty or not
            unblindedSecretCredentialsPerType:
                await unblindedSecretCredentialsPerTypeFrom(
                    secretCredentialsPerType,
                    userId
                ),
        })
    );
}

export function redirectToLogin() {
    store.dispatch(openAuthModal());
}
