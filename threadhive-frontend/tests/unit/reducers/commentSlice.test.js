import { describe, it, expect } from 'vitest';
import commentReducer, {
  fetchComments,
  addComment,
  upvoteCommentThunk,
  downvoteCommentThunk,
  clearComments,
} from '../../../src/reducers/commentSlice';

describe('commentSlice', () => {
  const initialState = {
    comments: [],
    loading: false,
    error: null,
  };

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = commentReducer(undefined, { type: 'unknown' });

      expect(state).toEqual(initialState);
    });
  });

  describe('clearComments action', () => {
    it('should reset state to initial state', () => {
      const previousState = {
        comments: [
          { _id: '1', content: 'Comment 1' },
          { _id: '2', content: 'Comment 2' },
        ],
        loading: true,
        error: 'Some error',
      };

      const state = commentReducer(previousState, clearComments());

      expect(state).toEqual(initialState);
    });
  });

  describe('fetchComments async thunk', () => {
    it('should handle pending state', () => {
      const state = commentReducer(initialState, fetchComments.pending());

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockComments = [
        { _id: '1', content: 'Comment 1', author: 'user1' },
        { _id: '2', content: 'Comment 2', author: 'user2' },
      ];

      const state = commentReducer(
        initialState,
        fetchComments.fulfilled(mockComments, '', 'thread-123')
      );

      expect(state.loading).toBe(false);
      expect(state.comments).toEqual(mockComments);
      expect(state.comments).toHaveLength(2);
    });

    it('should handle rejected state', () => {
      const errorMessage = 'Failed to fetch comments';
      const state = commentReducer(
        initialState,
        fetchComments.rejected(null, '', 'thread-123', errorMessage)
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('addComment async thunk', () => {
    it('should add new comment to the end of the list on fulfilled', () => {
      const previousState = {
        comments: [
          { _id: '1', content: 'First comment' },
        ],
        loading: false,
        error: null,
      };

      const newComment = { _id: '2', content: 'Second comment', author: 'user2' };
      const state = commentReducer(
        previousState,
        addComment.fulfilled(newComment, '', { threadId: 'thread-123', content: 'Second comment' })
      );

      expect(state.comments).toHaveLength(2);
      expect(state.comments[1]).toEqual(newComment);
      expect(state.comments[0]._id).toBe('1');
    });

    it('should add comment to empty list', () => {
      const newComment = { _id: '1', content: 'First comment' };
      const state = commentReducer(
        initialState,
        addComment.fulfilled(newComment, '', { threadId: 'thread-123', content: 'First comment' })
      );

      expect(state.comments).toHaveLength(1);
      expect(state.comments[0]).toEqual(newComment);
    });
  });

  describe('upvoteCommentThunk async thunk', () => {
    it('should update comment vote count on fulfilled', () => {
      const previousState = {
        comments: [
          { _id: '1', content: 'Comment 1', voteCount: 5 },
          { _id: '2', content: 'Comment 2', voteCount: 10 },
        ],
        loading: false,
        error: null,
      };

      const updatedComment = { _id: '1', content: 'Comment 1', voteCount: 6 };
      const state = commentReducer(
        previousState,
        upvoteCommentThunk.fulfilled(updatedComment, '', '1')
      );

      expect(state.comments[0].voteCount).toBe(6);
      expect(state.comments[1].voteCount).toBe(10); // Unchanged
    });

    it('should replace entire comment object on update', () => {
      const previousState = {
        comments: [
          { _id: '1', content: 'Old content', voteCount: 5, author: 'user1' },
        ],
        loading: false,
        error: null,
      };

      const updatedComment = { _id: '1', content: 'Old content', voteCount: 6 };
      const state = commentReducer(
        previousState,
        upvoteCommentThunk.fulfilled(updatedComment, '', '1')
      );

      // The updated comment replaces the old one completely
      expect(state.comments[0]).toEqual(updatedComment);
    });

    it('should not modify state if comment not found', () => {
      const previousState = {
        comments: [
          { _id: '1', content: 'Comment 1', voteCount: 5 },
        ],
        loading: false,
        error: null,
      };

      const updatedComment = { _id: '999', content: 'Non-existent', voteCount: 6 };
      const state = commentReducer(
        previousState,
        upvoteCommentThunk.fulfilled(updatedComment, '', '999')
      );

      expect(state.comments).toHaveLength(1);
      expect(state.comments[0]._id).toBe('1');
      expect(state.comments[0].voteCount).toBe(5); // Unchanged
    });
  });

  describe('downvoteCommentThunk async thunk', () => {
    it('should update comment vote count on fulfilled', () => {
      const previousState = {
        comments: [
          { _id: '1', content: 'Comment 1', voteCount: 5 },
          { _id: '2', content: 'Comment 2', voteCount: 10 },
        ],
        loading: false,
        error: null,
      };

      const updatedComment = { _id: '2', content: 'Comment 2', voteCount: 9 };
      const state = commentReducer(
        previousState,
        downvoteCommentThunk.fulfilled(updatedComment, '', '2')
      );

      expect(state.comments[0].voteCount).toBe(5); // Unchanged
      expect(state.comments[1].voteCount).toBe(9);
    });

    it('should handle multiple downvotes', () => {
      let state = {
        comments: [
          { _id: '1', content: 'Comment 1', voteCount: 5 },
        ],
        loading: false,
        error: null,
      };

      // First downvote
      const updated1 = { _id: '1', content: 'Comment 1', voteCount: 4 };
      state = commentReducer(state, downvoteCommentThunk.fulfilled(updated1, '', '1'));
      expect(state.comments[0].voteCount).toBe(4);

      // Second downvote
      const updated2 = { _id: '1', content: 'Comment 1', voteCount: 3 };
      state = commentReducer(state, downvoteCommentThunk.fulfilled(updated2, '', '1'));
      expect(state.comments[0].voteCount).toBe(3);
    });
  });
});
