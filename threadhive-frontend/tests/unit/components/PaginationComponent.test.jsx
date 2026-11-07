import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginationComponent from '../../../src/components/Shared/PaginationComponent';

describe('PaginationComponent', () => {
  it('should not render when totalPages is 1 or less', () => {
    const mockOnPageChange = vi.fn();

    const { container: container1 } = render(
      <PaginationComponent currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
    );
    expect(container1.textContent).toBe('');

    const { container: container2 } = render(
      <PaginationComponent currentPage={1} totalPages={0} onPageChange={mockOnPageChange} />
    );
    expect(container2.textContent).toBe('');
  });

  it('should render pagination controls when totalPages > 1', () => {
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    // Should have First, Prev, Next, Last buttons (using text content)
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Last')).toBeInTheDocument();
  });

  it('should disable First and Prev buttons on first page', () => {
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    const firstButton = screen.getByText('First').closest('.page-item');
    const prevButton = screen.getByText('Previous').closest('.page-item');
    const nextButton = screen.getByText('Next').closest('.page-item');
    const lastButton = screen.getByText('Last').closest('.page-item');

    expect(firstButton).toHaveClass('disabled');
    expect(prevButton).toHaveClass('disabled');
    expect(nextButton).not.toHaveClass('disabled');
    expect(lastButton).not.toHaveClass('disabled');
  });

  it('should disable Next and Last buttons on last page', () => {
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

    const firstButton = screen.getByText('First').closest('.page-item');
    const prevButton = screen.getByText('Previous').closest('.page-item');
    const nextButton = screen.getByText('Next').closest('.page-item');
    const lastButton = screen.getByText('Last').closest('.page-item');

    expect(firstButton).not.toHaveClass('disabled');
    expect(prevButton).not.toHaveClass('disabled');
    expect(nextButton).toHaveClass('disabled');
    expect(lastButton).toHaveClass('disabled');
  });

  it('should call onPageChange with correct page number when page button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    const page3Button = screen.getByText('3');
    await user.click(page3Button);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should call onPageChange when Next button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByText('Next').closest('a');
    await user.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should call onPageChange when Prev button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByText('Previous').closest('a');
    await user.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange with 1 when First button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const firstButton = screen.getByText('First').closest('a');
    await user.click(firstButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange with totalPages when Last button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={2} totalPages={10} onPageChange={mockOnPageChange} />);

    const lastButton = screen.getByText('Last').closest('a');
    await user.click(lastButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(10);
  });

  it('should show ellipsis for large page counts', () => {
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={5} totalPages={20} onPageChange={mockOnPageChange} />);

    // Should have ellipsis when there are many pages
    const ellipsis = screen.getAllByText('…');
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it('should highlight current page', () => {
    const mockOnPageChange = vi.fn();

    render(<PaginationComponent currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const page3Button = screen.getByText('3').closest('.page-item');
    expect(page3Button).toHaveClass('active');
  });
});
