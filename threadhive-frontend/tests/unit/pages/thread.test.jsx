import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import ThreadPage from "../../../src/pages/User/ThreadPage";
import threadReducer from "../../../src/reducers/threadListSlice";
import currentThreadReducer from "../../../src/reducers/currentThreadSlice";
import commentReducer from "../../../src/reducers/commentSlice";

const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const createTestStore = () => {
  return configureStore({
    reducer: {
      threads: threadReducer,
      currentThread: currentThreadReducer,
      comments: commentReducer,
    },
  });
};

const renderThreadPage = (threadId = "thread-1") => {
  const store = createTestStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/thread/" + threadId]}>
          <Routes>
            <Route path="/thread/:threadId" element={<ThreadPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
};

describe("Thread Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("renders thread details and author", async () => {
    renderThreadPage("thread-1");
    // MSW returns thread-1: "Getting Started with React" by John Doe
    await waitFor(() => {
      expect(
        screen.getByText("Getting Started with React"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("How do I start learning React?"),
    ).toBeInTheDocument();
    // John Doe appears as thread author and also as a comment author
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
  });

  it("renders comments and total count", async () => {
    renderThreadPage("thread-1");
    // MSW returns 2 comments for thread-1
    await waitFor(() => {
      expect(screen.getByText("2 total")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Great question! Start with the official docs."),
    ).toBeInTheDocument();
  });

  it("shows 'No comments yet' if there are no comments", async () => {
    renderThreadPage("thread-3");
    // thread-3 has no comments in mock data
    await waitFor(() => {
      expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
    });
  });

  it("renders upvote and downvote buttons for the thread", async () => {
    renderThreadPage("thread-1");
    await waitFor(() => {
      expect(
        screen.getByText("Getting Started with React"),
      ).toBeInTheDocument();
    });
    const upvoteBtns = screen.getAllByLabelText(/upvote/i);
    const downvoteBtns = screen.getAllByLabelText(/downvote/i);
    expect(upvoteBtns.length).toBeGreaterThanOrEqual(1);
    expect(downvoteBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("displays correct vote count for the thread", async () => {
    renderThreadPage("thread-1");
    // thread-1 has voteCount: 15
    await waitFor(() => {
      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  it("renders the comment form", async () => {
    renderThreadPage("thread-1");
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/write a comment/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /post comment/i }),
    ).toBeInTheDocument();
  });

  it("renders back to home button", async () => {
    renderThreadPage("thread-1");
    await waitFor(() => {
      expect(
        screen.getByText("Getting Started with React"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /back to home/i }),
    ).toBeInTheDocument();
  });

  it("shows thread not found for invalid thread", async () => {
    renderThreadPage("thread-999");
    await waitFor(() => {
      expect(screen.getByText(/thread not found/i)).toBeInTheDocument();
    });
  });
});
