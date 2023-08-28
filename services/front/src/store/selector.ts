import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from './store'

const selectSessionsData = (state: RootState) => {
    return Object.values(state.sessions.sessions).sort((s1, s2) => {
        if (s1.email === state.sessions.activeSessionEmail) {
            return -1
        }
        if (s2.email === state.sessions.activeSessionEmail) {
            return 1
        }
        if (s1.status === 'logged-in') {
            if (s2.status === 'logged-in') {
                return 0
            }
            return -1
        }
        if (s2.status === 'logged-in') {
            return 1
        }
        if (s1.status === 'logged-out') {
            if (s2.status === 'logged-out') {
                return 0
            }
            return -1
        }
        if (s2.status === 'logged-out') {
            return 1
        }
        if (s1.status === 'verifying') {
            if (s2.status === 'verifying') {
                return 0
            }
            return -1
        }
        if (s2.status === 'verifying') {
            return 1
        }
        return 0
    })
}

// see https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization - without this, we can a warning in the log
export const selectSortedSessionsData = createSelector(
    [selectSessionsData],
    (result) => {
        return result
    }
)

export const selectActiveSessionEmail = (state: RootState) => {
    return state.sessions.activeSessionEmail
}
