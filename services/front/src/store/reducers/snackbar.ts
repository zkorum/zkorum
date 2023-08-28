import type { AlertColor } from '@mui/material'
import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

// import type { RootState } from "../../store";

// Define a type for the slice state
export interface SnackbarState {
    isOpen: boolean
    severity: AlertColor
    message: string
}

// Define the initial state using that type
export const initialSnackbarState: SnackbarState = {
    isOpen: false,
    severity: 'info',
    message: '',
}

export const snackbarSlice = createSlice({
    name: 'snackbar',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState: initialSnackbarState,
    reducers: {
        closeSnackbar: (state) => {
            state.isOpen = false
        },
        showError: (state, action: PayloadAction<string>) => {
            state.severity = 'error'
            state.message = action.payload
            state.isOpen = true
        },
        showInfo: (state, action: PayloadAction<string>) => {
            state.severity = 'info'
            state.message = action.payload
            state.isOpen = true
        },
        showSuccess: (state, action: PayloadAction<string>) => {
            state.severity = 'success'
            state.message = action.payload
            state.isOpen = true
        },
        showWarning: (state, action: PayloadAction<string>) => {
            state.severity = 'warning'
            state.message = action.payload
            state.isOpen = true
        },
    },
})

export const { closeSnackbar, showError, showInfo, showSuccess, showWarning } =
    snackbarSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value;

export default snackbarSlice.reducer
