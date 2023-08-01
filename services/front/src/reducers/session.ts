import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

// import type { RootState } from "../../store";

// Define a type for the slice state
interface SessionState {
  isModalOpen: boolean;
  sessions: { [username: string]: SessionData };
  // isLoggedIn: boolean;
}

interface SessionData {
  status:
    | "register-crypto-added"
    | "register-email-validating"
    | "logging-email-validating"
    | "logged-in"
    | "logged-out";
}

interface CryptoGenerated {
  username: string;
}

// Define the initial state using that type
const initialState: SessionState = {
  isModalOpen: false,
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
    cryptoKeyAdded: (state, action: PayloadAction<CryptoGenerated>) => {
      state.sessions[action.payload.username] = {
        status: "register-crypto-added",
      };
    },
  },
});

export const { openModal, closeModal, cryptoKeyAdded } = sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default sessionSlice.reducer;
