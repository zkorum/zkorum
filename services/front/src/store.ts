import {
  configureStore,
  createListenerMiddleware,
  type TypedStartListening,
} from "@reduxjs/toolkit";
import sessionReducer from "./reducers/session";
import postsReducer from "./reducers/post";
import {
  storeRedux,
  type OfflineStorageState,
} from "./offline-storage/storage";

// Create the middleware instance and methods
const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

export const startAppListening =
  listenerMiddleware.startListening as AppStartListening;

// Add one or more listener entries that look for specific actions.
// They may contain any sync or async logic, similar to thunks.
startAppListening({
  predicate: (_action, currentState: RootState, previousState: RootState) => {
    // Trigger logic whenever this field changes
    return select(currentState) !== select(previousState);
  },
  effect: async (_action, listenerApi) => {
    listenerApi.cancelActiveListeners();
    await storeRedux(select(listenerApi.getState()));
  },
});

export const store = configureStore({
  reducer: {
    sessions: sessionReducer,
    posts: postsReducer,
    // comments: commentsReducer,
    // users: usersReducer,
  },
  // Add the listener middleware to the store.
  // NOTE: Since this can receive actions with functions inside,
  // it should go before the serializability check middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

function select(state: RootState): OfflineStorageState {
  return {
    activeSessionEmail: state.sessions.activeSessionUserId,
    sessions: state.sessions.sessions,
  };
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
