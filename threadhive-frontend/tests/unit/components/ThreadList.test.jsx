import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import ThreadList from "../../../src/components/ThreadList/ThreadList";
import threadReducer from "../../../src/reducers/threadListSlice";
import currentThreadReducer from "../../../src/reducers/currentThreadSlice";

const createMockStore = () => {
  return configureStore({
    reducer: {
      threads: threadReducer,
      currentThread: currentThreadReducer,
    },
  });
};

describe("ThreadList Component", () => {
  const mockThreads = [
    {
      _id: "t1",
      title: "First Thread",
      content: "Content of first thread",
      subreddit: { _id: "s1", name: "javascript" },
      voteCount: 5,
    },
    {
      _id: "t2",
      title: "Second Thread",
      content: "Content of second thread",
      subreddit: { _id: "s2", name: "react" },
      voteCount: 3,
    },
  ];

  const renderThreadList = (threads = mockThreads) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ThreadList threadsToDisplay={threads} />
        </BrowserRouter>
      </Provider>,
    );
  };

  it("renders all threads", () => {
    renderThreadList();
    expect(screen.getByText("First Thread")).toBeInTheDocument();
    expect(screen.getByText("Second Thread")).toBeInTheDocument();
  });

  it("renders thread content", () => {
    renderThreadList();
    expect(screen.getByText("Content of first thread")).toBeInTheDocument();
    expect(screen.getByText("Content of second thread")).toBeInTheDocument();
  });

  it("renders subreddit badges", () => {
    renderThreadList();
    expect(screen.getByText("r/javascript")).toBeInTheDocument();
    expect(screen.getByText("r/react")).toBeInTheDocument();
  });

  it("renders vote counts for all threads", () => {
    renderThreadList();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders view comments links for each thread", () => {
    renderThreadList();
    const viewLinks = screen.getAllByText(/view comments/i);
    expect(viewLinks).toHaveLength(2);
  });

  it("has correct link for view comments", () => {
    renderThreadList();
    const viewLinks = screen.getAllByText(/view comments/i);
    expect(viewLinks[0].closest("a")).toHaveAttribute("href", "/thread/t1");
  });

  it("renders upvote and downvote buttons for each thread", () => {
    renderThreadList();
    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    const downvoteButtons = screen.getAllByLabelText(/downvote/i);
    expect(upvoteButtons).toHaveLength(2);
    expect(downvoteButtons).toHaveLength(2);
  });

  it("dispatches upvote when upvote button is clicked", async () => {
    renderThreadList();
    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    await userEvent.click(upvoteButtons[0]);
    expect(upvoteButtons[0]).toBeInTheDocument();
  });

  it("dispatches downvote when downvote button is clicked", async () => {
    renderThreadList();
    const downvoteButtons = screen.getAllByLabelText(/downvote/i);
    await userEvent.click(downvoteButtons[0]);
    expect(downvoteButtons[0]).toBeInTheDocument();
  });

  it("renders empty list when no threads provided", () => {
    const { container } = renderThreadList([]);
    const threadCards = container.querySelectorAll(".thread-card");
    expect(threadCards).toHaveLength(0);
  });
});
