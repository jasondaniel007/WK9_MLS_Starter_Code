import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Home from "../../../src/pages/User/Home";
import threadReducer from "../../../src/reducers/threadListSlice";
import subredditReducer from "../../../src/reducers/subredditSlice";

const createMockStore = (threads = [], subreddits = []) => {
  return configureStore({
    reducer: {
      threads: () => ({ threads, loading: false, error: null }),
      subreddits: () => ({ subreddits, loading: false, error: null }),
    },
  });
};

describe("Home Component", () => {
  const mockThreads = [
    {
      _id: "t1",
      title: "First Thread",
      content: "Content for first thread",
      subreddit: { _id: "s1", name: "reactjs" },
      voteCount: 5,
      createdAt: "2024-01-10T10:00:00.000Z",
    },
    {
      _id: "t2",
      title: "Second Thread",
      content: "Content for second thread",
      subreddit: { _id: "s2", name: "vitest" },
      voteCount: 3,
      createdAt: "2024-01-11T12:00:00.000Z",
    },
  ];

  it("renders list of threads", () => {
    const store = createMockStore(mockThreads);
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </Provider>,
    );

    expect(screen.getByText("First Thread")).toBeInTheDocument();
    expect(screen.getByText("Second Thread")).toBeInTheDocument();
    expect(screen.getByText("Content for first thread")).toBeInTheDocument();
    expect(screen.getByText("Content for second thread")).toBeInTheDocument();
  });

  it("renders 'No threads found' if no threads", () => {
    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </Provider>,
    );

    expect(screen.getByText(/No threads found/i)).toBeInTheDocument();
  });

  it("renders upvote and downvote buttons for threads", () => {
    const store = createMockStore(mockThreads);
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      </Provider>,
    );

    const upvoteBtns = screen.getAllByLabelText(/upvote/i);
    const downvoteBtns = screen.getAllByLabelText(/downvote/i);
    expect(upvoteBtns.length).toBeGreaterThanOrEqual(2);
    expect(downvoteBtns.length).toBeGreaterThanOrEqual(2);
  });
});
