import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import localForage from "localforage";
import sessionReducer from "./reducers/session";
import snackbarReducer from "./reducers/snackbar";
import { getPersistConfig } from "redux-deep-persist";

/**
 * Inspired by https://github.com/machester4/redux-persist-indexeddb-storage
 */
const db = localForage.createInstance({
  name: "zkorum",
});
const storage = {
  db,
  getItem: db.getItem,
  setItem: db.setItem,
  removeItem: db.removeItem,
};

const rootReducer = combineReducers({
  sessions: sessionReducer,
  snackbar: snackbarReducer,
});

const persistedReducer = persistReducer(
  getPersistConfig({
    key: "root",
    storage,
    whitelist: ["sessions.activeSessionEmail", "sessions.sessions"],
    rootReducer,
  }),
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  // Add the listener middleware to the store.
  // NOTE: Since this can receive actions with functions inside,
  // it should go before the serializability check middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], // see https://redux-toolkit.js.org/usage/usage-guide#use-with-redux-persist
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
