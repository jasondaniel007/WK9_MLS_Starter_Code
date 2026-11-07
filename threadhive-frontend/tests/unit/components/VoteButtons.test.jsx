import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import VoteButtons from '../../../src/components/Shared/VoteButtons';

describe('VoteButtons Component', () => {
  it('renders upvote button', () => {
    render(<VoteButtons count={5} onUpvote={vi.fn()} onDownvote={vi.fn()} />);
    expect(screen.getByLabelText(/upvote/i)).toBeInTheDocument();
  });

  it('renders downvote button', () => {
    render(<VoteButtons count={5} onUpvote={vi.fn()} onDownvote={vi.fn()} />);
    expect(screen.getByLabelText(/downvote/i)).toBeInTheDocument();
  });

  it('displays the vote count', () => {
    render(<VoteButtons count={5} onUpvote={vi.fn()} onDownvote={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays negative vote count', () => {
    render(<VoteButtons count={-3} onUpvote={vi.fn()} onDownvote={vi.fn()} />);
    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('calls onUpvote when upvote button is clicked', async () => {
    const mockUpvote = vi.fn();
    render(<VoteButtons count={5} onUpvote={mockUpvote} onDownvote={vi.fn()} />);

    await userEvent.click(screen.getByLabelText(/upvote/i));
    expect(mockUpvote).toHaveBeenCalled();
  });

  it('calls onDownvote when downvote button is clicked', async () => {
    const mockDownvote = vi.fn();
    render(<VoteButtons count={5} onUpvote={vi.fn()} onDownvote={mockDownvote} />);

    await userEvent.click(screen.getByLabelText(/downvote/i));
    expect(mockDownvote).toHaveBeenCalled();
  });

  it('applies default vote-btn className to buttons', () => {
    const { container } = render(
      <VoteButtons
        count={5}
        onUpvote={vi.fn()}
        onDownvote={vi.fn()}
      />
    );
    const buttons = container.querySelectorAll('.vote-btn');
    expect(buttons.length).toBe(2);
  });

  it('applies vote-count className to count span', () => {
    const { container } = render(
      <VoteButtons
        count={5}
        onUpvote={vi.fn()}
        onDownvote={vi.fn()}
      />
    );
    expect(container.querySelector('.vote-count')).toBeInTheDocument();
  });
});
