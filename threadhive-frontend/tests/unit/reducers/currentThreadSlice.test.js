import { describe, it, expect } from "vitest";
import currentThreadReducer, {
  fetchThreadById,
  clearThread,
} from "../../../src/reducers/currentThreadSlice";
import {
  upvoteThreadThunk,
  downvoteThreadThunk,
} from "../../../src/reducers/threadListSlice";

describe("currentThreadSlice", () => {
  const initialState = {
    thread: null,
    loading: false,
    error: null,
    summary: null,
    summaryLoading: false,
    summaryError: null,
  };

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = currentThreadReducer(undefined, { type: "unknown" });

      expect(state).toEqual(initialState);
    });
  });

  describe("clearThread action", () => {
    it("should reset state to initial state", () => {
      const previousState = {
        thread: { _id: "1", title: "Test Thread", voteCount: 10 },
        loading: false,
        error: "Some error",
      };

      const state = currentThreadReducer(previousState, clearThread());

      expect(state).toEqual(initialState);
    });
  });

  describe("fetchThreadById async thunk", () => {
    it("should handle pending state", () => {
      const state = currentThreadReducer(
        initialState,
        fetchThreadById.pending(),
      );

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle fulfilled state", () => {
      const mockThread = {
        _id: "1",
        title: "Test Thread",
        content: "Test content",
        author: "user1",
        voteCount: 15,
      };

      const state = currentThreadReducer(
        initialState,
        fetchThreadById.fulfilled(mockThread, "", "1"),
      );

      expect(state.loading).toBe(false);
      expect(state.thread).toEqual(mockThread);
    });

    it("should handle rejected state", () => {
      const errorMessage = "Thread not found";
      const state = currentThreadReducer(
        initialState,
        fetchThreadById.rejected(null, "", "999", errorMessage),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should replace thread when fetching new thread", () => {
      const previousState = {
        thread: { _id: "1", title: "Old Thread" },
        loading: false,
        error: null,
      };

      const newThread = { _id: "2", title: "New Thread", voteCount: 20 };
      const state = currentThreadReducer(
        previousState,
        fetchThreadById.fulfilled(newThread, "", "2"),
      );

      expect(state.thread).toEqual(newThread);
      expect(state.thread._id).toBe("2");
    });
  });

  describe("upvoteThreadThunk integration", () => {
    it("should update thread voteCount when upvoted", () => {
      const previousState = {
        thread: { _id: "1", title: "Test Thread", voteCount: 10 },
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "1", title: "Test Thread", voteCount: 11 };
      const state = currentThreadReducer(
        previousState,
        upvoteThreadThunk.fulfilled(updatedThread, "", "1"),
      );

      expect(state.thread.voteCount).toBe(11);
      expect(state.thread._id).toBe("1");
    });

    it("should not update if thread IDs do not match", () => {
      const previousState = {
        thread: { _id: "1", title: "Test Thread", voteCount: 10 },
        loading: false,
        error: null,
      };

      const updatedThread = {
        _id: "2",
        title: "Different Thread",
        voteCount: 11,
      };
      const state = currentThreadReducer(
        previousState,
        upvoteThreadThunk.fulfilled(updatedThread, "", "2"),
      );

      expect(state.thread.voteCount).toBe(10); // Unchanged
      expect(state.thread._id).toBe("1");
    });

    it("should not crash if thread is null", () => {
      const previousState = {
        thread: null,
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "1", title: "Test Thread", voteCount: 11 };
      const state = currentThreadReducer(
        previousState,
        upvoteThreadThunk.fulfilled(updatedThread, "", "1"),
      );

      expect(state.thread).toBeNull();
    });
  });

  describe("downvoteThreadThunk integration", () => {
    it("should update thread voteCount when downvoted", () => {
      const previousState = {
        thread: { _id: "1", title: "Test Thread", voteCount: 10 },
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "1", title: "Test Thread", voteCount: 9 };
      const state = currentThreadReducer(
        previousState,
        downvoteThreadThunk.fulfilled(updatedThread, "", "1"),
      );

      expect(state.thread.voteCount).toBe(9);
      expect(state.thread._id).toBe("1");
    });

    it("should preserve other properties when updating vote count", () => {
      const previousState = {
        thread: {
          _id: "1",
          title: "Test Thread",
          content: "Test content",
          author: "user1",
          voteCount: 10,
        },
        loading: false,
        error: null,
      };

      const updatedThread = { _id: "1", voteCount: 9 };
      const state = currentThreadReducer(
        previousState,
        downvoteThreadThunk.fulfilled(updatedThread, "", "1"),
      );

      expect(state.thread).toEqual({
        _id: "1",
        title: "Test Thread",
        content: "Test content",
        author: "user1",
        voteCount: 9,
      });
    });

    it("should not update if thread IDs do not match", () => {
      const previousState = {
        thread: { _id: "1", title: "Test Thread", voteCount: 10 },
        loading: false,
        error: null,
      };

      const updatedThread = {
        _id: "2",
        title: "Different Thread",
        voteCount: 9,
      };
      const state = currentThreadReducer(
        previousState,
        downvoteThreadThunk.fulfilled(updatedThread, "", "2"),
      );

      expect(state.thread.voteCount).toBe(10); // Unchanged
      expect(state.thread._id).toBe("1");
    });
  });
});
