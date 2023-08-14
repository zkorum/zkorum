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
  codeId?: number;
  codeExpiry?: string;
  status: "authenticating" | "validating" | "logged-in" | "logged-out";
}

interface AuthenticateProps {
  userId: string;
  email: string;
}

interface ValidateProps {
  userId: string;
  codeExpiry: string;
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
      state.sessions[action.payload.userId] = {
        status: "authenticating",
        email: action.payload.email,
      };
      state.pendingSessionUserId = action.payload.userId;
    },
    validating: (state, action: PayloadAction<ValidateProps>) => {
      state.sessions[action.payload.userId].status = "validating";
      state.sessions[action.payload.userId].codeExpiry =
        action.payload.codeExpiry;
      state.pendingSessionUserId = action.payload.userId;
    },
  },
});

export const { openModal, closeModal, authenticating, validating } =
  sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
