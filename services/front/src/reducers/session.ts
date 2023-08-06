import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

// import type { RootState } from "../../store";

// Define a type for the slice state
interface SessionState {
  isModalOpen: boolean;
  activeSessionEmail: string;
  sessions: { [email: string]: SessionData };
  // isLoggedIn: boolean;
}

export interface SessionData {
  status:
    | "registering"
    | "register-email-validating"
    | "logging-email-validating"
    | "logged-in"
    | "logged-out";
}

interface RegisterProps {
  email: string;
}

// Define the initial state using that type
const initialState: SessionState = {
  isModalOpen: false,
  activeSessionEmail: "",
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
    registering: (state, action: PayloadAction<RegisterProps>) => {
      if (!(action.payload.email in state.sessions)) {
        state.sessions[action.payload.email] = {
          status: "registering",
        };
        state.activeSessionEmail = action.payload.email;
      } else {
        // TODO: better approach to error handling
        console.error("Trying to register username that already exist!");
      }
    },
  },
});

export const { openModal, closeModal, registering } = sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
