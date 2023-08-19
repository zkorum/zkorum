import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

// import type { RootState } from "../../store";

// Define a type for the slice state
interface SessionState {
  isModalOpen: boolean;
  activeSessionEmail: string;
  pendingSessionEmail: string; // during log in/register process
  sessions: { [userId: string]: SessionData };
  // isLoggedIn: boolean;
}

export interface SessionData {
  userId?: string;
  codeExpiry?: string;
  nextCodeSoonestTime?: string;
  status: "authenticating" | "verifying" | "logged-in" | "logged-out";
}

interface VerifyProps {
  email: string;
  codeExpiry: string;
  nextCodeSoonestTime: string;
}

interface AuthenticateProps {
  email: string;
}

// Define the initial state using that type
const initialState: SessionState = {
  isModalOpen: false,
  activeSessionEmail: "",
  pendingSessionEmail: "",
  sessions: {},
  // isLoggedIn: false,
};

export const sessionSlice = createSlice({
  name: "session",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    openAuthModal: (state) => {
      state.isModalOpen = true;
    },
    closeAuthModal: (state) => {
      state.isModalOpen = false;
    },
    authenticating: (state, action: PayloadAction<AuthenticateProps>) => {
      if (action.payload.email in state.sessions) {
        state.sessions[action.payload.email].status = "authenticating";
      } else {
        state.sessions[action.payload.email] = {
          status: "authenticating",
        };
      }
      state.pendingSessionEmail = action.payload.email;
    },
    verifying: (state, action: PayloadAction<VerifyProps>) => {
      if (action.payload.email in state.sessions) {
        state.sessions[action.payload.email].status = "verifying";
        state.sessions[action.payload.email].codeExpiry =
          action.payload.codeExpiry;
        state.sessions[action.payload.email].nextCodeSoonestTime =
          action.payload.nextCodeSoonestTime;
      } else {
        state.sessions[action.payload.email] = {
          status: "verifying",
          codeExpiry: action.payload.codeExpiry,
          nextCodeSoonestTime: action.payload.nextCodeSoonestTime,
        };
      }
      state.pendingSessionEmail = action.payload.email;
    },
  },
});

export const { openAuthModal, closeAuthModal, authenticating, verifying } =
  sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
