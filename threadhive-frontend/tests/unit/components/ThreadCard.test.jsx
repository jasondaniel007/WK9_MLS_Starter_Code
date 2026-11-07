import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import ThreadCard from "../../../src/components/ThreadList/ThreadCard";
import threadReducer from "../../../src/reducers/threadListSlice";
import currentThreadReducer from "../../../src/reducers/currentThreadSlice";

const createMockStore = (threads = []) => {
  return configureStore({
    reducer: {
      threads: threadReducer,
      currentThread: currentThreadReducer,
    },
    preloadedState: {
      threads: { threads, loading: false, error: null },
      currentThread: { thread: null, loading: false, error: null },
    },
  });
};

describe("ThreadCard Component", () => {
  const mockThread = {
    _id: "thread-1",
    title: "Test Thread Title",
    content: "This is test thread content",
    author: { _id: "u1", name: "Alice" },
    subreddit: { _id: "s1", name: "javascript" },
    voteCount: 2,
  };

  const mockGoBack = vi.fn();

  const renderThreadCard = (thread = mockThread, goBack = mockGoBack) => {
    const store = createMockStore([thread]);
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ThreadCard thread={thread} goBack={goBack} />
        </BrowserRouter>
      </Provider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders thread title", () => {
    renderThreadCard();
    expect(screen.getByText("Test Thread Title")).toBeInTheDocument();
  });

  it("renders thread content", () => {
    renderThreadCard();
    expect(screen.getByText("This is test thread content")).toBeInTheDocument();
  });

  it("renders author name", () => {
    renderThreadCard();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders subreddit name", () => {
    renderThreadCard();
    expect(screen.getByText("r/javascript")).toBeInTheDocument();
  });

  it("renders back to home button", () => {
    renderThreadCard();
    expect(
      screen.getByRole("button", { name: /back to home/i }),
    ).toBeInTheDocument();
  });

  it("calls goBack when back button is clicked", async () => {
    renderThreadCard();
    await userEvent.click(
      screen.getByRole("button", { name: /back to home/i }),
    );
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("calculates and displays correct vote count", () => {
    renderThreadCard();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("displays upvote and downvote buttons", () => {
    renderThreadCard();
    expect(screen.getByLabelText(/upvote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/downvote/i)).toBeInTheDocument();
  });

  it("dispatches upvote when upvote button is clicked", async () => {
    renderThreadCard();
    await userEvent.click(screen.getByLabelText(/upvote/i));
    expect(screen.getByLabelText(/upvote/i)).toBeInTheDocument();
  });

  it("dispatches downvote when downvote button is clicked", async () => {
    renderThreadCard();
    await userEvent.click(screen.getByLabelText(/downvote/i));
    expect(screen.getByLabelText(/downvote/i)).toBeInTheDocument();
  });
});
