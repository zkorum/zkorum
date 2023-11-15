import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { uint8ArrayToJSON } from "@/shared/common/arrbufs";
import { base64 } from "@/shared/common/index";
import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";
import type { SessionStatus } from "./reducers/session";
import type { UnblindedSecretCredentials } from "@/shared/types/zod";

const selectSessionsData = (state: RootState) => {
    return Object.values(state.sessions.sessions).sort((s1, s2) => {
        if (s1.email === state.sessions.activeSessionEmail) {
            return -1;
        }
        if (s2.email === state.sessions.activeSessionEmail) {
            return 1;
        }
        if (s1.status === "logged-in") {
            if (s2.status === "logged-in") {
                return 0;
            }
            return -1;
        }
        if (s2.status === "logged-in") {
            return 1;
        }
        if (s1.status === "logged-out") {
            if (s2.status === "logged-out") {
                return 0;
            }
            return -1;
        }
        if (s2.status === "logged-out") {
            return 1;
        }
        if (s1.status === "verifying") {
            if (s2.status === "verifying") {
                return 0;
            }
            return -1;
        }
        if (s2.status === "verifying") {
            return 1;
        }
        return 0;
    });
};

// see https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization - without this, we can a warning in the log
export const selectSortedSessionsData = createSelector(
    [selectSessionsData],
    (result) => {
        return result;
    }
);

export const selectActiveSessionEmail = (state: RootState) => {
    return state.sessions.activeSessionEmail;
};

export const selectActiveSessionUserId = (state: RootState) => {
    const activeSessionEmail = state.sessions.activeSessionEmail;
    if (state.sessions?.sessions === undefined) {
        return undefined;
    }
    if (!(activeSessionEmail in state.sessions.sessions)) {
        return undefined;
    }
    return state.sessions.sessions[activeSessionEmail].userId;
};

// for some reason this is called 5 times (in dev mode)!!!
// => TODO: look into optimizing this - ...
// The following console warning has to be investigated:
// Selector selectActiveEmailCredential returned a different result when called with the same parameters. This can lead to unnecessary rerenders.
// Selectors that return a new reference (such as an object or an array) should be memoized: https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization
export const selectActiveEmailCredential = (
    state: RootState
): Credential | undefined => {
    const activeSessionEmail = state.sessions.activeSessionEmail;
    if (activeSessionEmail === "") {
        return undefined;
    }
    const emailCredentialsPerEmail =
        state.sessions.sessions[activeSessionEmail]?.emailCredentialsPerEmail;
    if (
        emailCredentialsPerEmail !== undefined &&
        activeSessionEmail in emailCredentialsPerEmail
    ) {
        const encodedEmailCredential =
            emailCredentialsPerEmail[activeSessionEmail].active;
        if (encodedEmailCredential === undefined) {
            return undefined;
        } else {
            try {
                return Credential.fromJSON(
                    uint8ArrayToJSON(base64.decode(encodedEmailCredential))
                );
            } catch (e) {
                // TODO: better error handling
                // for now we catch it so it doesn't crash the entire app, though in case of error the whole app is pretty much unusable
                console.error("Error while parsing email credential", e);
            }
        }
    } else {
        return undefined;
    }
};

// for some reason this is called 5 times (in dev mode)!!!
// => TODO: look into optimizing this - ...
// The following console warning has to be investigated:
// Selector selectActiveEmailCredential returned a different result when called with the same parameters. This can lead to unnecessary rerenders.
// Selectors that return a new reference (such as an object or an array) should be memoized: https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization
export const selectActiveFormCredential = (
    state: RootState
): Credential | undefined => {
    const activeSessionEmail = state.sessions.activeSessionEmail;
    if (activeSessionEmail === "") {
        return undefined;
    }
    const formCredentialsPerEmail =
        state.sessions.sessions[activeSessionEmail]?.formCredentialsPerEmail;
    if (
        formCredentialsPerEmail !== undefined &&
        activeSessionEmail in formCredentialsPerEmail
    ) {
        const encodedFormCredential =
            formCredentialsPerEmail[activeSessionEmail].active;
        if (encodedFormCredential === undefined) {
            return undefined;
        } else {
            try {
                return Credential.fromJSON(
                    uint8ArrayToJSON(base64.decode(encodedFormCredential))
                );
            } catch (e) {
                // TODO: better error handling - how to recover the formCredentialsPerEmail?
                // for now we catch it so it doesn't crash the entire app, and return undefined
                console.error("Error while parsing form credential", e);
            }
        }
    } else {
        return undefined;
    }
};

export const selectActiveSessionStatus = (
    state: RootState
): SessionStatus | undefined => {
    const activeSessionEmail = state.sessions.activeSessionEmail;
    if (activeSessionEmail === "") {
        return undefined;
    }
    return state.sessions.sessions[activeSessionEmail]?.status;
};

export const selectActiveUnboundSecretCredential = (
    state: RootState
): Credential | undefined => {
    const activeSessionEmail = state.sessions.activeSessionEmail;
    if (activeSessionEmail === "") {
        return undefined;
    }
    const secretCredentialsPerType =
        state.sessions.sessions[activeSessionEmail]
            ?.unblindedSecretCredentialsPerType;
    if (
        secretCredentialsPerType !== undefined &&
        "unbound" in secretCredentialsPerType
    ) {
        const unblindedSecretCredential = (
            secretCredentialsPerType["unbound"] as UnblindedSecretCredentials
        ).active;
        if (unblindedSecretCredential === undefined) {
            return undefined;
        } else {
            try {
                const credential = Credential.fromJSON(
                    uint8ArrayToJSON(base64.decode(unblindedSecretCredential))
                );
                return credential;
            } catch (e) {
                // TODO: better error handling
                // for now we catch it so it doesn't crash the entire app, though in case of error the whole app is pretty much unusable
                console.error("Error while parsing secret credential", e);
            }
        }
    } else {
        return undefined;
    }
};
