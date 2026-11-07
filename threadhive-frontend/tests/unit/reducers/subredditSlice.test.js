import { describe, it, expect } from 'vitest';
import subredditReducer, {
  fetchSubreddits,
  clearSubreddits,
} from '../../../src/reducers/subredditSlice';

describe('subredditSlice', () => {
  const initialState = {
    subreddits: [],
    loading: false,
    error: null,
  };

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = subredditReducer(undefined, { type: 'unknown' });

      expect(state).toEqual(initialState);
    });
  });

  describe('clearSubreddits action', () => {
    it('should reset state to initial state', () => {
      const previousState = {
        subreddits: [
          { _id: '1', name: 'JavaScript', subscribers: 1000 },
          { _id: '2', name: 'Python', subscribers: 2000 },
        ],
        loading: true,
        error: 'Some error',
      };

      const state = subredditReducer(previousState, clearSubreddits());

      expect(state).toEqual(initialState);
    });
  });

  describe('fetchSubreddits async thunk', () => {
    it('should handle pending state', () => {
      const state = subredditReducer(initialState, fetchSubreddits.pending());

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockSubreddits = [
        { _id: '1', name: 'JavaScript', subscribers: 1500, description: 'JS community' },
        { _id: '2', name: 'Python', subscribers: 2500, description: 'Python community' },
        { _id: '3', name: 'React', subscribers: 3000, description: 'React community' },
      ];

      const state = subredditReducer(
        initialState,
        fetchSubreddits.fulfilled(mockSubreddits, '')
      );

      expect(state.loading).toBe(false);
      expect(state.subreddits).toEqual(mockSubreddits);
      expect(state.subreddits).toHaveLength(3);
    });

    it('should handle rejected state', () => {
      const errorMessage = 'Failed to fetch subreddits';
      const state = subredditReducer(
        initialState,
        fetchSubreddits.rejected(null, '', null, errorMessage)
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should replace existing subreddits on fulfilled', () => {
      const previousState = {
        subreddits: [
          { _id: '1', name: 'OldSubreddit', subscribers: 100 },
        ],
        loading: false,
        error: null,
      };

      const newSubreddits = [
        { _id: '2', name: 'NewSubreddit1', subscribers: 200 },
        { _id: '3', name: 'NewSubreddit2', subscribers: 300 },
      ];

      const state = subredditReducer(
        previousState,
        fetchSubreddits.fulfilled(newSubreddits, '')
      );

      expect(state.subreddits).toEqual(newSubreddits);
      expect(state.subreddits).toHaveLength(2);
      expect(state.subreddits.find(s => s._id === '1')).toBeUndefined();
    });

    it('should handle empty subreddit list', () => {
      const state = subredditReducer(
        initialState,
        fetchSubreddits.fulfilled([], '')
      );

      expect(state.loading).toBe(false);
      expect(state.subreddits).toEqual([]);
      expect(state.subreddits).toHaveLength(0);
    });

    it('should clear error on pending', () => {
      const previousState = {
        subreddits: [],
        loading: false,
        error: 'Previous error',
      };

      const state = subredditReducer(previousState, fetchSubreddits.pending());

      expect(state.error).toBeNull();
      expect(state.loading).toBe(true);
    });
  });
});
