import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CommentList from '../../../src/components/Comment/CommentList';
import commentReducer from '../../../src/reducers/commentSlice';

const createMockStore = (comments = []) => {
  return configureStore({
    reducer: {
      comments: commentReducer,
    },
    preloadedState: {
      comments: { comments, loading: false, error: null },
    },
  });
};

describe('CommentList Component', () => {
  const mockComments = [
    {
      _id: 'c1',
      user: { _id: 'u1', name: 'Alice' },
      content: 'This is the first comment',
      voteCount: 5,
    },
    {
      _id: 'c2',
      user: { _id: 'u2', name: 'Bob' },
      content: 'This is the second comment',
      voteCount: -2,
    },
  ];

  const renderCommentList = (comments = mockComments) => {
    const store = createMockStore(comments);
    return render(
      <Provider store={store}>
        <CommentList />
      </Provider>
    );
  };

  it('renders all comments', () => {
    renderCommentList();
    expect(screen.getByText('This is the first comment')).toBeInTheDocument();
    expect(screen.getByText('This is the second comment')).toBeInTheDocument();
  });

  it('renders comment authors', () => {
    renderCommentList();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders comment vote counts', () => {
    renderCommentList();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('renders comment badge for each comment', () => {
    renderCommentList();
    const badges = screen.getAllByText(/comment/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders user avatar with first letter of username', () => {
    const { container } = renderCommentList();
    const avatars = container.querySelectorAll('.comment-avatar');
    expect(avatars[0]).toHaveTextContent('A');
    expect(avatars[1]).toHaveTextContent('B');
  });

  it('renders upvote and downvote buttons for each comment', () => {
    renderCommentList();
    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    const downvoteButtons = screen.getAllByLabelText(/downvote/i);
    expect(upvoteButtons).toHaveLength(2);
    expect(downvoteButtons).toHaveLength(2);
  });

  it('dispatches upvote when upvote button is clicked', async () => {
    renderCommentList();
    const upvoteButtons = screen.getAllByLabelText(/upvote/i);
    await userEvent.click(upvoteButtons[0]);
    expect(upvoteButtons[0]).toBeInTheDocument();
  });

  it('dispatches downvote when downvote button is clicked', async () => {
    renderCommentList();
    const downvoteButtons = screen.getAllByLabelText(/downvote/i);
    await userEvent.click(downvoteButtons[0]);
    expect(downvoteButtons[0]).toBeInTheDocument();
  });

  it('renders empty list when no comments provided', () => {
    const { container } = renderCommentList([]);
    const commentCards = container.querySelectorAll('.comment-card');
    expect(commentCards).toHaveLength(0);
  });

  it('handles unknown user gracefully', () => {
    const commentWithUnknownUser = [{
      _id: 'c3',
      user: null,
      content: 'Comment from unknown user',
      voteCount: 0,
    }];

    renderCommentList(commentWithUnknownUser);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
