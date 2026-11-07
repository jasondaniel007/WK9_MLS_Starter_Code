// src/reducers/threadListSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchRecentThreads,
  upvoteThread,
  downvoteThread,
  createThread,
} from "../services/threadService";
import { handleApiError } from "../utils/handleApiError";

//Initial State
const initialState = {
  threads: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchThreads = createAsyncThunk(
  "threads/fetchThreads",
  async (_, thunkAPI) => {
    try {
      return await fetchRecentThreads();
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  },
);

export const createThreadThunk = createAsyncThunk(
  "threads/createThread",
  async (data, thunkAPI) => {
    try {
      const newThread = await createThread(data);
      return newThread;
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  },
);

export const upvoteThreadThunk = createAsyncThunk(
  "threads/upvote",
  async (threadId, thunkAPI) => {
    try {
      return await upvoteThread(threadId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  },
);

export const downvoteThreadThunk = createAsyncThunk(
  "threads/downvote",
  async (threadId, thunkAPI) => {
    try {
      return await downvoteThread(threadId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  },
);

//Slice
const threadListSlice = createSlice({
  name: "threads",
  initialState,
  reducers: {
    addThread: (state, action) => {
      state.threads.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchThreads
      .addCase(fetchThreads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.loading = false;
        state.threads = action.payload;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createThreadThunk.fulfilled, (state, action) => {
        // Add new thread to the top
        state.threads.unshift(action.payload);
      })
      .addCase(createThreadThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      // upvoteThreadThunk
      .addCase(upvoteThreadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.threads.findIndex((t) => t._id === updated._id);

        if (index !== -1) {
          state.threads[index] = {
            ...state.threads[index],
            ...updated,
          };
        }
      })

      // downvoteThreadThunk
      .addCase(downvoteThreadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.threads.findIndex((t) => t._id === updated._id);

        if (index !== -1) {
          state.threads[index] = {
            ...state.threads[index],
            ...updated,
          };
        }
      });
  },
});

// Export actions and reducer
export const { addThread } = threadListSlice.actions;
export default threadListSlice.reducer;
