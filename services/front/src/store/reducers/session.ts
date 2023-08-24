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
  | "logged-in"
  | "logged-out";

export interface SessionData {
  email: string;
  userId?: string;
  codeExpiry?: string;
  nextCodeSoonestTime?: string;
  status: SessionStatus;
}

interface VerifyProps {
  email: string;
  codeExpiry: string;
  nextCodeSoonestTime: string;
}

interface LoggedInProps {
  email: string;
  userId: string;
}

interface EmailProps {
  email: string;
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
      state.pendingSessionEmail = "";
      state.isModalOpen = false;
    },
    authenticating: (state, action: PayloadAction<EmailProps>) => {
      if (!(action.payload.email in state.sessions)) {
        state.sessions[action.payload.email] = {
          status: "authenticating",
          email: action.payload.email,
        };
      }
      state.pendingSessionEmail = action.payload.email;
    },
    verifying: (state, action: PayloadAction<VerifyProps>) => {
      if (action.payload.email in state.sessions) {
        state.sessions[action.payload.email].status = "verifying";
        state.sessions[action.payload.email].email = action.payload.email;
        state.sessions[action.payload.email].codeExpiry =
          action.payload.codeExpiry;
        state.sessions[action.payload.email].nextCodeSoonestTime =
          action.payload.nextCodeSoonestTime;
      } else {
        state.sessions[action.payload.email] = {
          status: "verifying",
          email: action.payload.email,
          codeExpiry: action.payload.codeExpiry,
          nextCodeSoonestTime: action.payload.nextCodeSoonestTime,
        };
      }
      state.isModalOpen = true;
      state.pendingSessionEmail = action.payload.email;
    },
    loggedIn: (state, action: PayloadAction<LoggedInProps>) => {
      if (action.payload.email in state.sessions) {
        state.sessions[action.payload.email].status = "logged-in";
        state.sessions[action.payload.email].email = action.payload.email;
        state.sessions[action.payload.email].userId = action.payload.userId;
      } else {
        state.sessions[action.payload.email] = {
          status: "logged-in",
          email: action.payload.email,
          userId: action.payload.userId,
        };
      }
      state.activeSessionEmail = action.payload.email;
      state.pendingSessionEmail = "";
      state.isModalOpen = false;
    },
    loggedOut: (state, action: PayloadAction<EmailProps>) => {
      if (action.payload.email in state.sessions) {
        state.sessions[action.payload.email].status = "logged-out";
        state.sessions[action.payload.email].email = action.payload.email;
      } else {
        state.sessions[action.payload.email] = {
          status: "logged-out",
          email: action.payload.email,
        };
      }
      if (state.activeSessionEmail === action.payload.email) {
        state.activeSessionEmail = "";
      }
    },
    resetPendingSession: (state) => {
      state.pendingSessionEmail = "";
    },
    removeSession: (state, action: PayloadAction<EmailProps>) => {
      if (
        action.payload.email in state.sessions &&
        (state.sessions[action.payload.email].status === "authenticating" ||
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
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  authenticating,
  verifying,
  loggedIn,
  loggedOut,
  resetPendingSession,
  removeSession,
  switchActiveSession,
} = sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
