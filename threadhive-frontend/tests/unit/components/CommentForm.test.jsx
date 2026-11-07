import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CommentForm from '../../../src/components/Comment/CommentForm';

describe('CommentForm Component', () => {
  it('renders the form title', () => {
    render(<CommentForm />);
    expect(screen.getByText(/add a comment/i)).toBeInTheDocument();
  });

  it('renders the comment textarea', () => {
    render(<CommentForm />);
    expect(screen.getByPlaceholderText(/write a comment.../i)).toBeInTheDocument();
  });

  it('renders the post comment button', () => {
    render(<CommentForm />);
    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument();
  });

  it('textarea is required', () => {
    render(<CommentForm />);
    const textarea = screen.getByPlaceholderText(/write a comment.../i);
    expect(textarea).toBeRequired();
  });

  it('allows typing in textarea', async () => {
    render(<CommentForm />);
    const textarea = screen.getByPlaceholderText(/write a comment.../i);

    await userEvent.type(textarea, 'This is a test comment');
    expect(textarea).toHaveValue('This is a test comment');
  });

  it('calls onPostComment callback when form is submitted', async () => {
    const mockOnPostComment = vi.fn();
    const mockOnCommentChange = vi.fn();
    render(
      <CommentForm
        commentText="Test comment"
        onCommentChange={mockOnCommentChange}
        onPostComment={mockOnPostComment}
      />
    );

    const submitButton = screen.getByRole('button', { name: /post comment/i });
    await userEvent.click(submitButton);

    expect(mockOnPostComment).toHaveBeenCalledTimes(1);
  });

  it('has correct number of textarea rows', () => {
    render(<CommentForm />);
    const textarea = screen.getByPlaceholderText(/write a comment.../i);
    expect(textarea).toHaveAttribute('rows', '4');
  });
});
