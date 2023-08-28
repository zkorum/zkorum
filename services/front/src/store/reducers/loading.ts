import { createSlice } from '@reduxjs/toolkit'

// Define a type for the slice state
export interface LoadingState {
    isMainLoadingOpen: boolean
}

// Define the initial state using that type
export const initialLoadingState: LoadingState = {
    isMainLoadingOpen: false,
}

export const loadingSlice = createSlice({
    name: 'snackbar',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState: initialLoadingState,
    reducers: {
        closeMainLoading: (state) => {
            state.isMainLoadingOpen = false
        },
        openMainLoading: (state) => {
            state.isMainLoadingOpen = true
        },
    },
})

export const { closeMainLoading, openMainLoading } = loadingSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default loadingSlice.reducer
