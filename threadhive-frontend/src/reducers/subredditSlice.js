import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchSubreddits as fetchSubredditsAPI,
  createSubreddit as createSubredditAPI,
  fetchSubredditWithThreads,
} from "../services/subredditService";
import { handleApiError } from "../utils/handleApiError";

const initialState = {
  subreddits: [],
  subredditData: null,
  loading: false,
  error: null,
};

// Async thunk to fetch all subreddits
export const fetchSubreddits = createAsyncThunk(
  "subreddits/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSubredditsAPI();
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  },
);

// Async thunk to fetch threads for a specific subreddit
export const fetchSubredditThreads = createAsyncThunk(
  "threads/fetchSubredditThreads",
  async (subredditId, thunkAPI) => {
    try {
      console.log("Fetching threads for subreddit:", subredditId);
      return await fetchSubredditWithThreads(subredditId);
    } catch (err) {
      return thunkAPI.rejectWithValue(handleApiError(err));
    }
  },
);

// Async thunk to create a subreddit
export const createSubreddit = createAsyncThunk(
  "subreddits/create",
  async ({ name, description }, { rejectWithValue }) => {
    try {
      return await createSubredditAPI({ name, description });
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  },
);

const subredditSlice = createSlice({
  name: "subreddits",
  initialState,
  reducers: {
    clearSubreddits: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubreddits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubreddits.fulfilled, (state, action) => {
        state.loading = false;
        state.subreddits = action.payload;
      })
      .addCase(fetchSubreddits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSubredditThreads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubredditThreads.fulfilled, (state, action) => {
        state.loading = false;
        state.subredditData = action.payload;
      })
      .addCase(fetchSubredditThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubreddit.fulfilled, (state, action) => {
        state.subreddits.push(action.payload);
      })
      .addCase(createSubreddit.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSubreddits } = subredditSlice.actions;
export default subredditSlice.reducer;
