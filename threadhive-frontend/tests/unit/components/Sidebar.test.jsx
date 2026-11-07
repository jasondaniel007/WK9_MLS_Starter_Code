import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../../../src/components/Sidebar/Sidebar';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/home' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const renderSidebar = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ...props,
  };

  return render(
    <BrowserRouter>
      <Sidebar {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocation.pathname = '/home';
  });

  it('should render menu items', () => {
    renderSidebar();

    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText(/Profile/)).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    mockLocation.pathname = '/home';
    renderSidebar();

    const homeItem = screen.getByText(/Home/).closest('.list-group-item');
    const profileItem = screen.getByText(/Profile/).closest('.list-group-item');

    expect(homeItem).toHaveClass('active');
    expect(profileItem).not.toHaveClass('active');
  });

  it('should highlight profile when on profile page', () => {
    mockLocation.pathname = '/profile';
    renderSidebar();

    const homeItem = screen.getByText(/Home/).closest('.list-group-item');
    const profileItem = screen.getByText(/Profile/).closest('.list-group-item');

    expect(homeItem).not.toHaveClass('active');
    expect(profileItem).toHaveClass('active');
  });

  it('should navigate to home when Home is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();

    const homeButton = screen.getByText(/Home/);
    await user.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should navigate to profile when Profile is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();

    const profileButton = screen.getByText(/Profile/);
    await user.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('should call onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    renderSidebar({ onClose: mockOnClose });

    const overlay = document.querySelector('.sidebar-overlay');
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have mobile-hidden class when isOpen is false', () => {
    renderSidebar({ isOpen: false });

    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('mobile-hidden');
  });

  it('should not have mobile-hidden class when isOpen is true', () => {
    renderSidebar({ isOpen: true });

    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('mobile-hidden');
  });

  it('should show overlay when isOpen is true', () => {
    renderSidebar({ isOpen: true });

    const overlay = document.querySelector('.sidebar-overlay');
    expect(overlay).toHaveClass('show');
  });

  it('should not show overlay when isOpen is false', () => {
    renderSidebar({ isOpen: false });

    const overlay = document.querySelector('.sidebar-overlay');
    expect(overlay).not.toHaveClass('show');
  });
});
