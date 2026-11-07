import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSortBar from '../../../src/components/Shared/FilterSortBar';

describe('FilterSortBar', () => {
  it('should render sort buttons', () => {
    const mockOnSortChange = vi.fn();

    render(<FilterSortBar sortBy="newest" onSortChange={mockOnSortChange} />);

    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText(/Newest/)).toBeInTheDocument();
    expect(screen.getByText(/Most Upvoted/)).toBeInTheDocument();
  });

  it('should highlight "newest" button when sortBy is "newest"', () => {
    const mockOnSortChange = vi.fn();

    render(<FilterSortBar sortBy="newest" onSortChange={mockOnSortChange} />);

    const newestButton = screen.getByText(/Newest/).closest('button');
    const upvotedButton = screen.getByText(/Most Upvoted/).closest('button');

    expect(newestButton).toHaveClass('sort-btn-active');
    expect(upvotedButton).toHaveClass('sort-btn');
  });

  it('should highlight "most-upvoted" button when sortBy is "most-upvoted"', () => {
    const mockOnSortChange = vi.fn();

    render(<FilterSortBar sortBy="most-upvoted" onSortChange={mockOnSortChange} />);

    const newestButton = screen.getByText(/Newest/).closest('button');
    const upvotedButton = screen.getByText(/Most Upvoted/).closest('button');

    expect(newestButton).toHaveClass('sort-btn');
    expect(upvotedButton).toHaveClass('sort-btn-active');
  });

  it('should call onSortChange with "newest" when Newest button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSortChange = vi.fn();

    render(<FilterSortBar sortBy="most-upvoted" onSortChange={mockOnSortChange} />);

    const newestButton = screen.getByText(/Newest/).closest('button');
    await user.click(newestButton);

    expect(mockOnSortChange).toHaveBeenCalledTimes(1);
    expect(mockOnSortChange).toHaveBeenCalledWith('newest');
  });

  it('should call onSortChange with "most-upvoted" when Most Upvoted button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSortChange = vi.fn();

    render(<FilterSortBar sortBy="newest" onSortChange={mockOnSortChange} />);

    const upvotedButton = screen.getByText(/Most Upvoted/).closest('button');
    await user.click(upvotedButton);

    expect(mockOnSortChange).toHaveBeenCalledTimes(1);
    expect(mockOnSortChange).toHaveBeenCalledWith('most-upvoted');
  });

  it('should handle multiple clicks', async () => {
    const user = userEvent.setup();
    const mockOnSortChange = vi.fn();

    render(<FilterSortBar sortBy="newest" onSortChange={mockOnSortChange} />);

    const newestButton = screen.getByText(/Newest/).closest('button');
    const upvotedButton = screen.getByText(/Most Upvoted/).closest('button');

    await user.click(upvotedButton);
    await user.click(newestButton);
    await user.click(upvotedButton);

    expect(mockOnSortChange).toHaveBeenCalledTimes(3);
    expect(mockOnSortChange).toHaveBeenNthCalledWith(1, 'most-upvoted');
    expect(mockOnSortChange).toHaveBeenNthCalledWith(2, 'newest');
    expect(mockOnSortChange).toHaveBeenNthCalledWith(3, 'most-upvoted');
  });
});
