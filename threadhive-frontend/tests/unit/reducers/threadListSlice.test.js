import { describe, it, expect, vi } from "vitest";
import threadReducer, {
  fetchThreads,
  createThreadThunk,
  upvoteThreadThunk,
  downvoteThreadThunk,
  addThread,
} from "../../../src/reducers/threadListSlice";

describe("threadListSlice", () => {
  const initialState = {
    threads: [],
    loading: false,
    error: null,
  };

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = threadReducer(undefined, { type: "unknown" });

      expect(state).toEqual(initialState);
    });
  });

  describe("addThread reducer", () => {
    it("should add a thread to the beginning of the list", () => {
      const previousState = {
        threads: [
          { _id: "2", title: "Second Thread" },
          { _id: "3", title: "Third Thread" },
        ],
        loading: false,
        error: null,
      };

      const newThread = { _id: "1", title: "First Thread" };
      const state = threadReducer(previousState, addThread(newThread));

      expect(state.threads).toHaveLength(3);
      expect(state.threads[0]).toEqual(newThread);
      expect(state.threads[1]._id).toBe("2");
    });
  });

  describe("fetchThreads async thunk", () => {
    it("should handle pending state", () => {
      const state = threadReducer(initialState, fetchThreads.pending());

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle fulfilled state", () => {
      const mockThreads = [
        { _id: "1", title: "Thread 1", voteCount: 10 },
        { _id: "2", title: "Thread 2", voteCount: 5 },
      ];

      const state = threadReducer(
        initialState,
        fetchThreads.fulfilled(mockThreads, ""),
      );

      expect(state.loading).toBe(false);
      expect(state.threads).toEqual(mockThreads);
      expect(state.threads).toHaveLength(2);
    });

    it("should handle rejected state", () => {
      const errorMessage = "Failed to fetch threads";
      const state = threadReducer(
        initialState,
        fetchThreads.rejected(null, "", null, errorMessage),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe("createThreadThunk async thunk", () => {
    it("should add new thread to the beginning on fulfilled", () => {
      const existingThreads = [{ _id: "1", title: "Existing Thread" }];
      const previousState = {
        threads: existingThreads,
        loading: false,
        error: null,
      };

      const newThread = { _id: "2", title: "New Thread", content: "Content" };
      const state = threadReducer(
        previousState,
        createThreadThunk.fulfilled(newThread, "", {}),
      );

      expect(state.threads).toHaveLength(2);
      expect(state.threads[0]).toEqual(newThread);
      expect(state.threads[1]).toEqual(existingThreads[0]);
    });

    it("should set error on rejected", () => {
      const errorMessage = "Failed to create thread";
      const state = threadReducer(
        initialState,
        createThreadThunk.rejected(null, "", {}, errorMessage),
      );

      expect(state.error).toBe(errorMessage);
    });
  });

  describe("upvoteThreadThunk async thunk", () => {
    it("should update thread vote count on fulfilled", () => {
      const previousState = {
        threads: [
          { _id: "1", title: "Thread 1", voteCount: 10 },
          { _id: "2", title: "Thread 2", voteCount: 5 },
        ],
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "1", title: "Thread 1", voteCount: 11 };
      const state = threadReducer(
        previousState,
        upvoteThreadThunk.fulfilled(updatedThread, "", "1"),
      );

      expect(state.threads[0].voteCount).toBe(11);
      expect(state.threads[1].voteCount).toBe(5); // Unchanged
    });

    it("should not modify state if thread not found", () => {
      const previousState = {
        threads: [{ _id: "1", title: "Thread 1", voteCount: 10 }],
        loading: false,
        error: null,
      };

      const updatedThread = {
        _id: "999",
        title: "Non-existent",
        voteCount: 11,
      };
      const state = threadReducer(
        previousState,
        upvoteThreadThunk.fulfilled(updatedThread, "", "999"),
      );

      expect(state.threads).toHaveLength(1);
      expect(state.threads[0]._id).toBe("1");
      expect(state.threads[0].voteCount).toBe(10); // Unchanged
    });
  });

  describe("downvoteThreadThunk async thunk", () => {
    it("should update thread vote count on fulfilled", () => {
      const previousState = {
        threads: [
          { _id: "1", title: "Thread 1", voteCount: 10 },
          { _id: "2", title: "Thread 2", voteCount: 5 },
        ],
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "2", title: "Thread 2", voteCount: 4 };
      const state = threadReducer(
        previousState,
        downvoteThreadThunk.fulfilled(updatedThread, "", "2"),
      );

      expect(state.threads[0].voteCount).toBe(10); // Unchanged
      expect(state.threads[1].voteCount).toBe(4);
    });

    it("should merge updated properties correctly", () => {
      const previousState = {
        threads: [
          { _id: "1", title: "Thread 1", voteCount: 10, author: "user1" },
        ],
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "1", voteCount: 9, newProperty: "value" };
      const state = threadReducer(
        previousState,
        downvoteThreadThunk.fulfilled(updatedThread, "", "1"),
      );

      expect(state.threads[0]).toEqual({
        _id: "1",
        title: "Thread 1",
        voteCount: 9,
        author: "user1",
        newProperty: "value",
      });
    });
  });
});
