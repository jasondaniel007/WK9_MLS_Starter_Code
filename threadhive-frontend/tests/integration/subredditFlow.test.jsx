import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import subredditReducer, {
  fetchSubreddits,
  clearSubreddits,
} from '../../src/reducers/subredditSlice';

/**
 * Integration Tests: Subreddit Operations with Redux + MSW
 * Tests verify that subreddit-related Redux actions work correctly with MSW-mocked APIs
 */

const createTestStore = () => {
  return configureStore({
    reducer: {
      subreddits: subredditReducer,
    },
  });
};

describe('Subreddit Flow Integration Tests (Redux + MSW)', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Fetch Subreddits', () => {
    it('should fetch all subreddits successfully', async () => {
      const result = await store.dispatch(fetchSubreddits());

      expect(fetchSubreddits.fulfilled.match(result)).toBe(true);

      const state = store.getState().subreddits;
      expect(state.loading).toBe(false);
      expect(Array.isArray(state.subreddits)).toBe(true);
      expect(state.subreddits.length).toBeGreaterThan(0);
      expect(state.error).toBeNull();
    });

    it('should have correct subreddit data structure', async () => {
      await store.dispatch(fetchSubreddits());

      const state = store.getState().subreddits;
      const subreddit = state.subreddits[0];

      expect(subreddit).toHaveProperty('_id');
      expect(subreddit).toHaveProperty('name');
      expect(subreddit).toHaveProperty('description');
      expect(subreddit).toHaveProperty('author');
    });

    it('should contain expected subreddits from mock data', async () => {
      await store.dispatch(fetchSubreddits());

      const state = store.getState().subreddits;
      const subredditNames = state.subreddits.map((s) => s.name);

      expect(subredditNames).toContain('JavaScript');
      expect(subredditNames).toContain('Python');
      expect(subredditNames).toContain('React');
    });

    it('should have subscriber counts', async () => {
      await store.dispatch(fetchSubreddits());

      const state = store.getState().subreddits;
      state.subreddits.forEach((subreddit) => {
        expect(subreddit).toHaveProperty('subscribers');
        expect(typeof subreddit.subscribers).toBe('number');
        expect(subreddit.subscribers).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Clear Subreddits', () => {
    it('should clear all subreddits and reset state', async () => {
      // First fetch subreddits
      await store.dispatch(fetchSubreddits());
      expect(store.getState().subreddits.subreddits.length).toBeGreaterThan(0);

      // Clear subreddits
      store.dispatch(clearSubreddits());

      const state = store.getState().subreddits;
      expect(state.subreddits).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain unique subreddit IDs', async () => {
      await store.dispatch(fetchSubreddits());

      const state = store.getState().subreddits;
      const subredditIds = state.subreddits.map((s) => s._id);

      const uniqueIds = new Set(subredditIds);
      expect(uniqueIds.size).toBe(subredditIds.length);
    });

    it('should have valid descriptions', async () => {
      await store.dispatch(fetchSubreddits());

      const state = store.getState().subreddits;
      state.subreddits.forEach((subreddit) => {
        expect(subreddit.description).toBeDefined();
        expect(typeof subreddit.description).toBe('string');
        expect(subreddit.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple Operations', () => {
    it('should replace existing subreddits on subsequent fetch', async () => {
      // First fetch
      await store.dispatch(fetchSubreddits());
      const firstFetchCount = store.getState().subreddits.subreddits.length;

      // Second fetch
      await store.dispatch(fetchSubreddits());
      const secondFetchCount = store.getState().subreddits.subreddits.length;

      expect(secondFetchCount).toBe(firstFetchCount);
    });

    it('should handle fetch -> clear -> fetch cycle', async () => {
      // Fetch
      await store.dispatch(fetchSubreddits());
      const firstFetch = store.getState().subreddits.subreddits;
      expect(firstFetch.length).toBeGreaterThan(0);

      // Clear
      store.dispatch(clearSubreddits());
      expect(store.getState().subreddits.subreddits.length).toBe(0);

      // Fetch again
      await store.dispatch(fetchSubreddits());
      const secondFetch = store.getState().subreddits.subreddits;
      expect(secondFetch.length).toBe(firstFetch.length);
    });
  });
});
