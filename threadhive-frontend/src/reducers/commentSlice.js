import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchCommentsForThread,
  postComment as postCommentAPI,
  upvoteComment,
  downvoteComment,
} from '../services/commentService';
import { handleApiError } from '../utils/handleApiError';

// Async Thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (threadId, { rejectWithValue }) => {
    try {
      return await fetchCommentsForThread(threadId);
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ threadId, content }, { rejectWithValue }) => {
    try {
      return await postCommentAPI({ threadId, content });
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);


export const upvoteCommentThunk = createAsyncThunk(
  'comments/upvote',
  async (commentId, { rejectWithValue }) => {
    try {
      return await upvoteComment(commentId);
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

export const downvoteCommentThunk = createAsyncThunk(
  'comments/downvote',
  async (commentId, { rejectWithValue }) => {
    try {
      return await downvoteComment(commentId);
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  }
);

// Initial State
const initialState = {
  comments: [],
  loading: false,
  error: null,
};

// Slice
const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearComments: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchComments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // addComment
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })

      // upvoteComment
      .addCase(upvoteCommentThunk.fulfilled, (state, action) => {
        state.comments = state.comments.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })

      // downvoteComment
      .addCase(downvoteCommentThunk.fulfilled, (state, action) => {
        state.comments = state.comments.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      });
  },
});

// Export actions and reducer
export const { clearComments } = commentSlice.actions;
export default commentSlice.reducer;