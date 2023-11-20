import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { uint8ArrayToJSON } from "@/shared/common/arrbufs";
import { base64 } from "@/shared/common/index";
import { BBSPlusCredential as Credential } from "@docknetwork/crypto-wasm-ts";
import type { SessionStatus } from "./reducers/session";

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

export const selectSessions = (state: RootState) => {
    return state.sessions.sessions;
};

export const selectFormCredentialsPerEmail = createSelector(
    [selectActiveSessionEmail, selectSessions],
    (activeSessionEmail, sessions) => {
        if (activeSessionEmail === undefined || activeSessionEmail === "") {
            return undefined;
        }
        return sessions[activeSessionEmail]?.formCredentialsPerEmail;
    }
);

export const selectEmailCredentialsPerEmail = createSelector(
    [selectActiveSessionEmail, selectSessions],
    (activeSessionEmail, sessions) => {
        if (activeSessionEmail === undefined || activeSessionEmail === "") {
            return undefined;
        }
        return sessions[activeSessionEmail]?.emailCredentialsPerEmail;
    }
);

export const selectUnblindedSecretCredentialsPerType = createSelector(
    [selectActiveSessionEmail, selectSessions],
    (activeSessionEmail, sessions) => {
        if (activeSessionEmail === undefined || activeSessionEmail === "") {
            return undefined;
        }
        return sessions[activeSessionEmail]?.unblindedSecretCredentialsPerType;
    }
);

export const selectActiveEncodedFormCredential = createSelector(
    [selectFormCredentialsPerEmail, selectActiveSessionEmail],
    function (formCredentialsPerEmail, activeSessionEmail) {
        if (formCredentialsPerEmail === undefined) {
            return undefined;
        } else {
            return formCredentialsPerEmail[activeSessionEmail]?.active;
        }
    }
);

export const selectActiveEncodedEmailCredential = createSelector(
    [selectEmailCredentialsPerEmail, selectActiveSessionEmail],
    function (emailCredentialsPerEmail, activeSessionEmail) {
        if (emailCredentialsPerEmail === undefined) {
            return undefined;
        } else {
            return emailCredentialsPerEmail[activeSessionEmail]?.active;
        }
    }
);

export const selectActiveEncodedUnboundSecretCredential = createSelector(
    [selectUnblindedSecretCredentialsPerType],
    function (unblindedSecretCredentialsPerType) {
        if (unblindedSecretCredentialsPerType === undefined) {
            return undefined;
        } else {
            return unblindedSecretCredentialsPerType["unbound"]?.active;
        }
    }
);

export const selectActiveFormCredential = createSelector(
    [selectActiveEncodedFormCredential],
    function (activeEncodedFormCredential) {
        if (activeEncodedFormCredential === undefined) {
            return undefined;
        } else {
            try {
                return Credential.fromJSON(
                    uint8ArrayToJSON(base64.decode(activeEncodedFormCredential))
                );
            } catch (e) {
                // TODO: better error handling
                // for now we catch it so it doesn't crash the entire app, though in case of error the whole app is pretty much unusable
                console.error("Error while parsing form credential", e);
                return undefined;
            }
        }
    }
);

export const selectActiveEmailCredential = createSelector(
    [selectActiveEncodedEmailCredential],
    function (activeEncodedEmailCredential) {
        if (activeEncodedEmailCredential === undefined) {
            return undefined;
        } else {
            try {
                return Credential.fromJSON(
                    uint8ArrayToJSON(
                        base64.decode(activeEncodedEmailCredential)
                    )
                );
            } catch (e) {
                // TODO: better error handling
                // for now we catch it so it doesn't crash the entire app, though in case of error the whole app is pretty much unusable
                console.error("Error while parsing email credential", e);
                return undefined;
            }
        }
    }
);

export const selectActiveUnboundSecretCredential = createSelector(
    [selectActiveEncodedUnboundSecretCredential],
    function (activeEncodedUnboundSecretCredential) {
        if (activeEncodedUnboundSecretCredential === undefined) {
            return undefined;
        } else {
            try {
                return Credential.fromJSON(
                    uint8ArrayToJSON(
                        base64.decode(activeEncodedUnboundSecretCredential)
                    )
                );
            } catch (e) {
                // TODO: better error handling
                // for now we catch it so it doesn't crash the entire app, though in case of error the whole app is pretty much unusable
                console.error("Error while parsing secret credential", e);
                return undefined;
            }
        }
    }
);

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

export const selectActiveSessionStatus = (
    state: RootState
): SessionStatus | undefined => {
    const activeSessionEmail = state.sessions.activeSessionEmail;
    if (activeSessionEmail === "") {
        return undefined;
    }
    return state.sessions.sessions[activeSessionEmail]?.status;
};
