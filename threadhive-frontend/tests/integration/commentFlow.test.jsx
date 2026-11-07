import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import commentReducer, {
  fetchComments,
  addComment,
  upvoteCommentThunk,
  downvoteCommentThunk,
  clearComments,
} from '../../src/reducers/commentSlice';

/**
 * Integration Tests: Comment Operations with Redux + MSW
 * Tests verify that comment-related Redux actions work correctly with MSW-mocked APIs
 */

const createTestStore = () => {
  return configureStore({
    reducer: {
      comments: commentReducer,
    },
  });
};

describe('Comment Flow Integration Tests (Redux + MSW)', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Fetch Comments', () => {
    it('should fetch comments for a thread successfully', async () => {
      const threadId = 'thread-1';
      const result = await store.dispatch(fetchComments(threadId));

      expect(fetchComments.fulfilled.match(result)).toBe(true);

      const state = store.getState().comments;
      expect(state.loading).toBe(false);
      expect(Array.isArray(state.comments)).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should return empty array for thread with no comments', async () => {
      const result = await store.dispatch(fetchComments('thread-999'));

      expect(fetchComments.fulfilled.match(result)).toBe(true);

      const state = store.getState().comments;
      expect(state.comments).toEqual([]);
    });

    it('should have correct comment data structure', async () => {
      await store.dispatch(fetchComments('thread-1'));

      const state = store.getState().comments;
      if (state.comments.length > 0) {
        const comment = state.comments[0];
        expect(comment).toHaveProperty('_id');
        expect(comment).toHaveProperty('content');
        expect(comment).toHaveProperty('user');
        expect(comment).toHaveProperty('voteCount');
      }
    });
  });

  describe('Add Comment', () => {
    it('should add a new comment successfully', async () => {
      const commentData = {
        threadId: 'thread-1',
        content: 'This is a test comment from integration test',
      };

      const result = await store.dispatch(addComment(commentData));

      expect(addComment.fulfilled.match(result)).toBe(true);

      const state = store.getState().comments;
      expect(state.comments.length).toBeGreaterThan(0);

      const addedComment = state.comments.find(
        (c) => c.content === 'This is a test comment from integration test'
      );
      expect(addedComment).toBeDefined();
    });

    it('should add comment to the end of existing comments', async () => {
      // First fetch existing comments
      await store.dispatch(fetchComments('thread-1'));
      const initialCount = store.getState().comments.comments.length;

      // Add new comment
      const result = await store.dispatch(
        addComment({
          threadId: 'thread-1',
          content: 'New comment at the end',
        })
      );

      expect(addComment.fulfilled.match(result)).toBe(true);

      const state = store.getState().comments;
      expect(state.comments.length).toBe(initialCount + 1);

      const lastComment = state.comments[state.comments.length - 1];
      expect(lastComment.content).toBe('New comment at the end');
    });

    it('should handle multiple comments addition', async () => {
      const threadId = 'thread-1';

      await store.dispatch(addComment({ threadId, content: 'First comment' }));
      await store.dispatch(addComment({ threadId, content: 'Second comment' }));
      await store.dispatch(addComment({ threadId, content: 'Third comment' }));

      const state = store.getState().comments;
      expect(state.comments.length).toBe(3);
    });
  });

  describe('Comment Voting', () => {
    beforeEach(async () => {
      await store.dispatch(fetchComments('thread-1'));
    });

    it('should upvote a comment and update vote count', async () => {
      const state = store.getState().comments;
      const comment = state.comments[0];
      const initialVoteCount = comment.voteCount;

      const result = await store.dispatch(upvoteCommentThunk(comment._id));

      expect(upvoteCommentThunk.fulfilled.match(result)).toBe(true);

      const updatedState = store.getState().comments;
      const updatedComment = updatedState.comments.find((c) => c._id === comment._id);
      expect(updatedComment.voteCount).toBe(initialVoteCount + 1);
    });

    it('should downvote a comment and update vote count', async () => {
      const state = store.getState().comments;
      const comment = state.comments[0];
      const initialVoteCount = comment.voteCount;

      const result = await store.dispatch(downvoteCommentThunk(comment._id));

      expect(downvoteCommentThunk.fulfilled.match(result)).toBe(true);

      const updatedState = store.getState().comments;
      const updatedComment = updatedState.comments.find((c) => c._id === comment._id);
      expect(updatedComment.voteCount).toBe(initialVoteCount - 1);
    });
  });

  describe('Clear Comments', () => {
    it('should clear all comments', async () => {
      // Add some comments first
      await store.dispatch(fetchComments('thread-1'));
      expect(store.getState().comments.comments.length).toBeGreaterThan(0);

      // Clear comments
      store.dispatch(clearComments());

      const state = store.getState().comments;
      expect(state.comments).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Complete Comment Workflow', () => {
    it('should handle fetch -> add -> upvote -> clear flow', async () => {
      const threadId = 'thread-1';

      // Fetch existing comments
      const fetchResult = await store.dispatch(fetchComments(threadId));
      expect(fetchComments.fulfilled.match(fetchResult)).toBe(true);
      const initialCount = store.getState().comments.comments.length;

      // Add new comment
      const addResult = await store.dispatch(
        addComment({ threadId, content: 'Workflow test comment' })
      );
      expect(addComment.fulfilled.match(addResult)).toBe(true);
      expect(store.getState().comments.comments.length).toBe(initialCount + 1);

      // Upvote a known comment (MSW only recognizes pre-defined IDs)
      const upvoteResult = await store.dispatch(upvoteCommentThunk('comment-1'));
      expect(upvoteCommentThunk.fulfilled.match(upvoteResult)).toBe(true);

      // Clear all comments
      store.dispatch(clearComments());
      expect(store.getState().comments.comments).toEqual([]);
    });
  });
});
