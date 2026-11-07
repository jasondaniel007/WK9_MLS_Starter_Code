import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducers/authSlice";
import threadReducer from "../reducers/threadListSlice";
import currentThreadReducer from "../reducers/currentThreadSlice";
import commentReducer from "../reducers/commentSlice";
import themeReducer from "../reducers/themeSlice";
import subredditReducer from "../reducers/subredditSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    threads: threadReducer, // all recent threads
    currentThread: currentThreadReducer, // current thread view
    comments: commentReducer, // comments for current thread
    theme: themeReducer, // dark mode theme
    subreddits: subredditReducer, // all subreddits
  },
});
