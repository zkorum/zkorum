import { nowZeroMs } from "@/shared/common/util";
import type {
    Devices,
    EmailCredentialsPerEmail,
    ResponseToPollPayload,
    UnblindedSecretCredentialsPerType,
    PollResponsesByPostUid,
} from "@/shared/types/zod";
import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

// import type { RootState } from "../../store";

// Define a type for the slice state
export interface SessionState {
    isModalOpen: boolean;
    activeSessionEmail: string;
    pendingSessionEmail: string; // during log in/register process
    sessions: { [email: string]: SessionData };
    // isLoggedIn: boolean;
}

export type SessionStatus =
    | "authenticating"
    | "verifying"
    | "awaiting-syncing"
    | "logged-in"
    | "logged-out";

export interface SessionData {
    email: string;
    userId?: string;
    sessionExpiry?: string;
    codeExpiry?: string;
    nextCodeSoonestTime?: string;
    status: SessionStatus;
    encryptedSymmKey?: string;
    isRegistration?: boolean;
    syncingDevices?: Devices;
    emailCredentialsPerEmail?: EmailCredentialsPerEmail;
    unblindedSecretCredentialsPerType?: UnblindedSecretCredentialsPerType;
    pollResponsesByPostUid?: PollResponsesByPostUid;
}

interface VerifyProps {
    email: string;
    userId?: string;
    codeExpiry: string;
    nextCodeSoonestTime: string;
}

interface LoggedInProps {
    email: string;
    userId: string;
    sessionExpiry: string;
    encryptedSymmKey: string;
    isRegistration: boolean;
    syncingDevices: Devices;
    emailCredentialsPerEmail: EmailCredentialsPerEmail;
    unblindedSecretCredentialsPerType: UnblindedSecretCredentialsPerType;
}

interface SyncingProps {
    email: string;
    userId: string;
    sessionExpiry: string;
    syncingDevices: Devices;
}

interface EmailProps {
    email: string;
}

interface AuthenticatingProps {
    email: string;
    userId?: string;
}

interface UpdateCredentialsProps {
    emailCredentialsPerEmail: EmailCredentialsPerEmail;
    unblindedSecretCredentialsPerType: UnblindedSecretCredentialsPerType;
}

interface InsertOrUpdateResponseToPollProps {
    respondentPseudonym: string;
    responsePayload: ResponseToPollPayload;
}

// Define the initial state using that type
export const initialSessionState: SessionState = {
    isModalOpen: false,
    activeSessionEmail: "",
    pendingSessionEmail: "",
    sessions: {},
    // isLoggedIn: false,
};

export const sessionSlice = createSlice({
    name: "session",
    // `createSlice` will infer the state type from the `initialState` argument
    initialState: initialSessionState,
    reducers: {
        openAuthModal: (state) => {
            state.isModalOpen = true;
        },
        closeAuthModal: (state) => {
            state.isModalOpen = false;
        },
        authenticating: (state, action: PayloadAction<AuthenticatingProps>) => {
            if (!(action.payload.email in state.sessions)) {
                state.sessions[action.payload.email] = {
                    status: "authenticating",
                    email: action.payload.email,
                    userId: action.payload.userId,
                };
            }
            state.pendingSessionEmail = action.payload.email;
        },
        verifying: (state, action: PayloadAction<VerifyProps>) => {
            if (action.payload.email in state.sessions) {
                state.sessions[action.payload.email].status = "verifying";
                state.sessions[action.payload.email].email =
                    action.payload.email;
                state.sessions[action.payload.email].userId =
                    action.payload.userId;
                state.sessions[action.payload.email].codeExpiry =
                    action.payload.codeExpiry;
                state.sessions[action.payload.email].nextCodeSoonestTime =
                    action.payload.nextCodeSoonestTime;
            } else {
                state.sessions[action.payload.email] = {
                    status: "verifying",
                    email: action.payload.email,
                    userId: action.payload.userId,
                    codeExpiry: action.payload.codeExpiry,
                    nextCodeSoonestTime: action.payload.nextCodeSoonestTime,
                };
            }
            state.isModalOpen = true;
            state.pendingSessionEmail = action.payload.email;
        },
        awaitingSyncing: (state, action: PayloadAction<SyncingProps>) => {
            if (action.payload.email in state.sessions) {
                state.sessions[action.payload.email].status =
                    "awaiting-syncing";
                state.sessions[action.payload.email].email =
                    action.payload.email;
                state.sessions[action.payload.email].userId =
                    action.payload.userId;
                state.sessions[action.payload.email].sessionExpiry =
                    action.payload.sessionExpiry;
                state.sessions[action.payload.email].syncingDevices =
                    action.payload.syncingDevices;
            } else {
                state.sessions[action.payload.email] = {
                    status: "awaiting-syncing",
                    email: action.payload.email,
                    userId: action.payload.userId,
                    sessionExpiry: action.payload.sessionExpiry,
                    syncingDevices: action.payload.syncingDevices,
                };
            }
            state.isModalOpen = true;
            state.pendingSessionEmail = action.payload.email;
        },
        loggedIn: (state, action: PayloadAction<LoggedInProps>) => {
            if (action.payload.email in state.sessions) {
                state.sessions[action.payload.email].status = "logged-in";
                state.sessions[action.payload.email].email =
                    action.payload.email;
                state.sessions[action.payload.email].userId =
                    action.payload.userId;
                state.sessions[action.payload.email].sessionExpiry =
                    action.payload.sessionExpiry;
                state.sessions[action.payload.email].encryptedSymmKey =
                    action.payload.encryptedSymmKey;
                state.sessions[action.payload.email].isRegistration =
                    action.payload.isRegistration;
                state.sessions[action.payload.email].syncingDevices =
                    action.payload.syncingDevices;
                state.sessions[action.payload.email].emailCredentialsPerEmail =
                    action.payload.emailCredentialsPerEmail;
                state.sessions[
                    action.payload.email
                ].unblindedSecretCredentialsPerType =
                    action.payload.unblindedSecretCredentialsPerType;
            } else {
                state.sessions[action.payload.email] = {
                    status: "logged-in",
                    email: action.payload.email,
                    userId: action.payload.userId,
                    sessionExpiry: action.payload.sessionExpiry,
                    encryptedSymmKey: action.payload.encryptedSymmKey,
                    isRegistration: action.payload.isRegistration,
                    syncingDevices: action.payload.syncingDevices,
                    emailCredentialsPerEmail:
                        action.payload.emailCredentialsPerEmail,
                    unblindedSecretCredentialsPerType:
                        action.payload.unblindedSecretCredentialsPerType,
                };
            }
            state.activeSessionEmail = action.payload.email;
        },
        loggedOut: (state, action: PayloadAction<EmailProps>) => {
            if (action.payload.email === "") {
                console.error("Attempt to log out from empty email");
                return;
            }
            if (state.activeSessionEmail === action.payload.email) {
                state.activeSessionEmail = "";
            }
            if (action.payload.email in state.sessions) {
                state.sessions[action.payload.email].status = "logged-out";
                state.sessions[action.payload.email].email =
                    action.payload.email;
            } else {
                state.sessions[action.payload.email] = {
                    status: "logged-out",
                    email: action.payload.email,
                };
            }
        },
        awaitingSyncingLoggedOut: (
            state,
            action: PayloadAction<EmailProps>
        ) => {
            const now = nowZeroMs(); // TODO just use returned value by backend onLogout
            if (action.payload.email === "") {
                console.error("Attempt to log out from empty email");
                return;
            }
            if (state.pendingSessionEmail === action.payload.email) {
                state.pendingSessionEmail = "";
            }
            if (action.payload.email in state.sessions) {
                state.sessions[action.payload.email].status = "logged-out";
                state.sessions[action.payload.email].email =
                    action.payload.email;
                state.sessions[action.payload.email].sessionExpiry =
                    now.toISOString();
            } else {
                state.sessions[action.payload.email] = {
                    status: "logged-out",
                    email: action.payload.email,
                    sessionExpiry: now.toISOString(),
                };
            }
        },
        resetPendingSession: (state) => {
            state.pendingSessionEmail = "";
        },
        removeSession: (state, action: PayloadAction<EmailProps>) => {
            if (
                action.payload.email in state.sessions &&
                (state.sessions[action.payload.email].status ===
                    "authenticating" ||
                    state.sessions[action.payload.email].status === "verifying")
            ) {
                delete state.sessions[action.payload.email];
            }
        },
        switchActiveSession: (state, action: PayloadAction<EmailProps>) => {
            if (
                action.payload.email in state.sessions &&
                state.sessions[action.payload.email].status === "logged-in"
            ) {
                state.activeSessionEmail = action.payload.email;
                state.isModalOpen = false;
            }
        },
        setPendingSessionCodeExpiry: (state, action: PayloadAction<string>) => {
            if (state.pendingSessionEmail in state.sessions) {
                state.sessions[state.pendingSessionEmail].codeExpiry =
                    action.payload;
            }
        },
        updateCredentials: (
            state,
            action: PayloadAction<UpdateCredentialsProps>
        ) => {
            if (
                state.activeSessionEmail in state.sessions &&
                state.sessions[state.activeSessionEmail].status === "logged-in"
            ) {
                state.sessions[
                    state.activeSessionEmail
                ].emailCredentialsPerEmail =
                    action.payload.emailCredentialsPerEmail;
                state.sessions[
                    state.activeSessionEmail
                ].unblindedSecretCredentialsPerType =
                    action.payload.unblindedSecretCredentialsPerType;
            }
        },
        insertOrUpdateResponseToPoll: (
            state,
            action: PayloadAction<InsertOrUpdateResponseToPollProps>
        ) => {
            if (
                state.activeSessionEmail in state.sessions &&
                state.sessions[state.activeSessionEmail].status === "logged-in"
            ) {
                if (
                    state.sessions[state.activeSessionEmail]
                        .pollResponsesByPostUid === undefined
                ) {
                    state.sessions[
                        state.activeSessionEmail
                    ].pollResponsesByPostUid = {
                        [action.payload.responsePayload.postUid]: {
                            optionChosen:
                                action.payload.responsePayload.optionChosen,
                            respondentPseudonym:
                                action.payload.respondentPseudonym,
                        },
                    };
                } else {
                    (
                        state.sessions[state.activeSessionEmail]
                            .pollResponsesByPostUid as PollResponsesByPostUid
                    )[action.payload.responsePayload.postUid] = {
                        optionChosen:
                            action.payload.responsePayload.optionChosen,
                        respondentPseudonym: action.payload.respondentPseudonym,
                    };
                }
            }
        },
    },
});

export const {
    openAuthModal,
    closeAuthModal,
    authenticating,
    verifying,
    loggedIn,
    awaitingSyncing,
    loggedOut,
    awaitingSyncingLoggedOut,
    resetPendingSession,
    removeSession,
    switchActiveSession,
    setPendingSessionCodeExpiry,
    updateCredentials,
    insertOrUpdateResponseToPoll,
} = sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
