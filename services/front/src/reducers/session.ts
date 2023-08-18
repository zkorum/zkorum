import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

// import type { RootState } from "../../store";

// Define a type for the slice state
interface SessionState {
  isModalOpen: boolean;
  activeSessionUserId: string;
  pendingSessionUserId: string; // during log in/register process
  sessions: { [userId: string]: SessionData };
  // isLoggedIn: boolean;
}

export interface SessionData {
  email: string;
  codeExpiry?: string;
  nextCodeSoonestTime?: string;
  status: "authenticating" | "verifying" | "logged-in" | "logged-out";
}

interface VerifyProps {
  userId: string;
  codeExpiry: string;
  nextCodeSoonestTime: string;
}

interface AuthenticateProps {
  userId: string;
  email: string;
}

// Define the initial state using that type
const initialState: SessionState = {
  isModalOpen: false,
  activeSessionUserId: "",
  pendingSessionUserId: "",
  sessions: {},
  // isLoggedIn: false,
};

export const sessionSlice = createSlice({
  name: "session",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    openModal: (state) => {
      state.isModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    authenticating: (state, action: PayloadAction<AuthenticateProps>) => {
      if (action.payload.userId in state.sessions) {
        state.sessions[action.payload.userId].status = "authenticating";
        state.sessions[action.payload.userId].email = action.payload.email;
      } else {
        state.sessions[action.payload.userId] = {
          status: "authenticating",
          email: action.payload.email,
        };
      }
      state.pendingSessionUserId = action.payload.userId;
    },
    verifying: (state, action: PayloadAction<VerifyProps>) => {
      state.sessions[action.payload.userId].status = "verifying";
      (state.sessions[action.payload.userId].codeExpiry =
        action.payload.codeExpiry),
        (state.sessions[action.payload.userId].nextCodeSoonestTime =
          action.payload.nextCodeSoonestTime),
        (state.pendingSessionUserId = action.payload.userId);
    },
  },
});

export const { openModal, closeModal, authenticating, verifying } =
  sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
