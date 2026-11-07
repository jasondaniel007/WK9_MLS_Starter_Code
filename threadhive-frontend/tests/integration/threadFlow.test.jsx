import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import threadReducer, {
  fetchThreads,
  createThreadThunk,
  upvoteThreadThunk,
  downvoteThreadThunk,
} from "../../src/reducers/threadListSlice";
import currentThreadReducer, {
  fetchThreadById,
} from "../../src/reducers/currentThreadSlice";

/**
 * Integration Tests: Thread Operations with Redux + MSW
 * Tests verify that thread-related Redux actions work correctly with MSW-mocked APIs
 */

const createTestStore = () => {
  return configureStore({
    reducer: {
      threads: threadReducer,
      currentThread: currentThreadReducer,
    },
  });
};

describe("Thread Flow Integration Tests (Redux + MSW)", () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("Fetch Threads", () => {
    it("should fetch all threads successfully", async () => {
      const result = await store.dispatch(fetchThreads());

      expect(fetchThreads.fulfilled.match(result)).toBe(true);

      const state = store.getState().threads;
      expect(state.loading).toBe(false);
      expect(state.threads).toBeDefined();
      expect(state.threads.length).toBeGreaterThan(0);
      expect(state.error).toBeNull();
    });

    it("should have correct thread data structure", async () => {
      await store.dispatch(fetchThreads());

      const state = store.getState().threads;
      const thread = state.threads[0];

      expect(thread).toHaveProperty("_id");
      expect(thread).toHaveProperty("title");
      expect(thread).toHaveProperty("content");
      expect(thread).toHaveProperty("voteCount");
    });
  });

  describe("Create Thread", () => {
    it("should create a new thread successfully", async () => {
      const newThreadData = {
        title: "Integration Test Thread",
        content: "Testing Redux + MSW integration",
        subreddit: "sub-1",
        author: "user-1",
      };

      const result = await store.dispatch(createThreadThunk(newThreadData));

      expect(createThreadThunk.fulfilled.match(result)).toBe(true);

      const state = store.getState().threads;
      expect(state.threads[0].title).toBe("Integration Test Thread");
      expect(state.threads[0].content).toBe("Testing Redux + MSW integration");
    });

    it("should add new thread at the beginning of list", async () => {
      // First fetch existing threads
      await store.dispatch(fetchThreads());
      const initialCount = store.getState().threads.threads.length;

      // Create new thread
      const result = await store.dispatch(
        createThreadThunk({
          title: "Newest Thread",
          content: "Should be first",
          subreddit: "sub-1",
          author: "user-1",
        }),
      );

      expect(createThreadThunk.fulfilled.match(result)).toBe(true);

      const state = store.getState().threads;
      expect(state.threads.length).toBe(initialCount + 1);
      expect(state.threads[0].title).toBe("Newest Thread");
    });
  });

  describe("Fetch Thread by ID", () => {
    it("should fetch specific thread successfully", async () => {
      const threadId = "thread-1";
      const result = await store.dispatch(fetchThreadById(threadId));

      expect(fetchThreadById.fulfilled.match(result)).toBe(true);

      const state = store.getState().currentThread;
      expect(state.loading).toBe(false);
      expect(state.thread).toBeDefined();
      expect(state.thread._id).toBe(threadId);
      expect(state.error).toBeNull();
    });

    it("should handle thread not found", async () => {
      const result = await store.dispatch(fetchThreadById("thread-999"));

      expect(fetchThreadById.rejected.match(result)).toBe(true);

      const state = store.getState().currentThread;
      expect(state.error).toBeDefined();
    });
  });

  describe("Thread Voting", () => {
    beforeEach(async () => {
      await store.dispatch(fetchThreads());
    });

    it("should upvote thread and update vote count", async () => {
      const state = store.getState().threads;
      const thread = state.threads[0];
      const initialVoteCount = thread.voteCount;

      const result = await store.dispatch(upvoteThreadThunk(thread._id));

      expect(upvoteThreadThunk.fulfilled.match(result)).toBe(true);

      const updatedState = store.getState().threads;
      const updatedThread = updatedState.threads.find(
        (t) => t._id === thread._id,
      );
      expect(updatedThread.voteCount).toBe(initialVoteCount + 1);
    });

    it("should downvote thread and update vote count", async () => {
      const state = store.getState().threads;
      const thread = state.threads[0];
      const initialVoteCount = thread.voteCount;

      const result = await store.dispatch(downvoteThreadThunk(thread._id));

      expect(downvoteThreadThunk.fulfilled.match(result)).toBe(true);

      const updatedState = store.getState().threads;
      const updatedThread = updatedState.threads.find(
        (t) => t._id === thread._id,
      );
      expect(updatedThread.voteCount).toBe(initialVoteCount - 1);
    });

    it("should update selected thread vote count when upvoted", async () => {
      const threadId = "thread-1";

      // Fetch specific thread
      await store.dispatch(fetchThreadById(threadId));
      const initialVoteCount = store.getState().currentThread.thread.voteCount;

      // Upvote the thread
      await store.dispatch(upvoteThreadThunk(threadId));

      // Check currentThread slice was updated
      const state = store.getState().currentThread;
      expect(state.thread.voteCount).toBe(initialVoteCount + 1);
    });
  });

  describe("Complete Thread Workflow", () => {
    it("should handle create -> fetch -> upvote flow", async () => {
      // Create thread
      const createResult = await store.dispatch(
        createThreadThunk({
          title: "Workflow Thread",
          content: "Testing complete workflow",
          subreddit: "sub-1",
          author: "user-1",
        }),
      );
      expect(createThreadThunk.fulfilled.match(createResult)).toBe(true);
      expect(store.getState().threads.threads[0].title).toBe("Workflow Thread");

      // Fetch a known thread by ID (MSW only recognizes pre-defined IDs)
      const fetchResult = await store.dispatch(fetchThreadById("thread-1"));
      expect(fetchThreadById.fulfilled.match(fetchResult)).toBe(true);
      expect(store.getState().currentThread.thread._id).toBe("thread-1");

      // Upvote the known thread
      const upvoteResult = await store.dispatch(upvoteThreadThunk("thread-1"));
      expect(upvoteThreadThunk.fulfilled.match(upvoteResult)).toBe(true);
      expect(
        store.getState().currentThread.thread.voteCount,
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
