import { createSlice } from "@reduxjs/toolkit";
// import type { RootState } from "../../store";

// Define a type for the slice state
interface PostState {
  isModalOpen: boolean;
  // isLoggedIn: boolean;
}

// Define the initial state using that type
const initialState: PostState = {
  isModalOpen: false,
  // isLoggedIn: false,
};

export const postSlice = createSlice({
  name: "post",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    openModal: (state) => {
      state.isModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    // incrementByAmount: (state, action: PayloadAction<number>) => {
    //   state.value += action.payload;
    // },
  },
});

export const { openModal, closeModal } = postSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default postSlice.reducer;
