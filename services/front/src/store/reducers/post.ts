import { createSlice } from "@reduxjs/toolkit";

// Define a type for the slice state
export interface PostState {
    isPostModalOpen: boolean;
}

// Define the initial state using that type
export const initialPostState: PostState = {
    isPostModalOpen: false,
};

export const postSlice = createSlice({
    name: "post",
    // `createSlice` will infer the state type from the `initialState` argument
    initialState: initialPostState,
    reducers: {
        closePostModal: (state) => {
            state.isPostModalOpen = false;
        },
        openPostModal: (state) => {
            state.isPostModalOpen = true;
        },
    },
});

export const { closePostModal, openPostModal } = postSlice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default postSlice.reducer;
