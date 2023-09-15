import { store } from "../store/store";
import {
    verifying,
    authenticating,
    loggedOut,
    loggedIn,
    switchActiveSession,
    type SessionData,
} from "../store/reducers/session";
import * as DID from "../crypto/ucan/did/index";
import {
    DefaultApiFactory,
    type AuthAuthenticatePost200Response,
    type AuthVerifyOtpPost200Response,
} from "../api/api";
import {
    activeSessionUcanAxios,
    pendingSessionUcanAxios,
} from "../interceptors";
import { getOrGenerateCryptoKey } from "../crypto/ucan/ucan";
import axios from "axios";
import { showError, showSuccess } from "../store/reducers/snackbar";
import { authSuccess, genericError } from "../components/error/message";
import { closeMainLoading, openMainLoading } from "../store/reducers/loading";

export async function authenticate(
    email: string,
    isRequestingNewCode: boolean
): Promise<AuthAuthenticatePost200Response | "logged-in"> {
    // TODO: email may be changed in the future, so this will have to be dealt with
    const newCryptoKey = await getOrGenerateCryptoKey(email);

    // this is a necessary step for interceptor to inject UCAN
    store.dispatch(authenticating({ email: email }));

    const didExchange = await DID.exchange(newCryptoKey);

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
                codeExpiry: otpDetails.data.codeExpiry,
                nextCodeSoonestTime: otpDetails.data.nextCodeSoonestTime,
            })
        );
        return otpDetails.data;
    } catch (e) {
        if (axios.isAxiosError(e)) {
            if (e.status === 409) {
                store.dispatch(
                    loggedIn({
                        email: email,
                        userId: e.message,
                    })
                );
                return "logged-in";
            } else {
                throw e;
            }
        } else {
            throw e;
        }
    }
}

export async function verifyOtp(
    code: number
): Promise<AuthVerifyOtpPost200Response> {
    const verifyOtpResult = await DefaultApiFactory(
        undefined,
        undefined,
        pendingSessionUcanAxios
    ).authVerifyOtpPost({
        code: code,
    });
    return verifyOtpResult.data;
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

export function handleOnAuthenticate(email: string) {
    store.dispatch(openMainLoading());
    // do register the user
    authenticate(email, false)
        .then((response) => {
            if (response === "logged-in") {
                store.dispatch(showSuccess(authSuccess));
            }
            // else go to next step => validate email address => automatic via redux store update
        })
        .catch((_e) => {
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
        handleOnAuthenticate(session.email);
    }
}
