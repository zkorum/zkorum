import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./reducers/session";
import postsReducer from "./reducers/post";

export const store = configureStore({
  reducer: {
    sessions: sessionReducer,
    posts: postsReducer,
    // comments: commentsReducer,
    // users: usersReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
