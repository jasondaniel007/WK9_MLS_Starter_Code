import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RightSidebar from '../../../src/components/RightSidebar/RightSidebar';
import subredditReducer from '../../../src/reducers/subredditSlice';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = (subredditsState) => {
  return configureStore({
    reducer: {
      subreddits: () => subredditsState,
    },
  });
};

const renderWithProviders = (store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <RightSidebar />
      </BrowserRouter>
    </Provider>
  );
};

describe('RightSidebar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should show loading state', () => {
    const store = createMockStore({
      subreddits: [],
      loading: true,
      error: null,
    });

    renderWithProviders(store);

    const loadingTexts = screen.getAllByText('Loading...');
    expect(loadingTexts.length).toBeGreaterThan(0);
  });

  it('should render hot communities section', () => {
    const store = createMockStore({
      subreddits: [],
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    expect(screen.getByText(/Hot Communities/)).toBeInTheDocument();
  });

  it('should render recently added section', () => {
    const store = createMockStore({
      subreddits: [],
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    expect(screen.getByText(/Recently Added/)).toBeInTheDocument();
  });

  it('should show "No communities found" when subreddits array is empty', () => {
    const store = createMockStore({
      subreddits: [],
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    expect(screen.getByText('No communities found')).toBeInTheDocument();
    expect(screen.getByText('No recent communities')).toBeInTheDocument();
  });

  it('should render hot subreddits list', () => {
    const mockSubreddits = [
      { _id: '1', name: 'JavaScript', description: 'JS community' },
      { _id: '2', name: 'Python', description: 'Python community' },
      { _id: '3', name: 'React', description: 'React community' },
    ];

    const store = createMockStore({
      subreddits: mockSubreddits,
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    // Use getAllByText since subreddits appear in both Hot and Recently Added sections
    expect(screen.getAllByText('r/JavaScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('r/Python').length).toBeGreaterThan(0);
    expect(screen.getAllByText('r/React').length).toBeGreaterThan(0);
  });

  it('should display subreddit descriptions', () => {
    const mockSubreddits = [
      { _id: '1', name: 'JavaScript', description: 'All about JS' },
    ];

    const store = createMockStore({
      subreddits: mockSubreddits,
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    expect(screen.getAllByText('All about JS').length).toBeGreaterThan(0);
  });

  it('should show ranking badges in hot communities', () => {
    const mockSubreddits = [
      { _id: '1', name: 'JavaScript', description: 'JS' },
      { _id: '2', name: 'Python', description: 'Py' },
    ];

    const store = createMockStore({
      subreddits: mockSubreddits,
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('should navigate when subreddit is clicked', async () => {
    const user = userEvent.setup();
    const mockSubreddits = [
      { _id: 'sub123', name: 'JavaScript', description: 'JS' },
    ];

    const store = createMockStore({
      subreddits: mockSubreddits,
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    const subredditItems = screen.getAllByText('r/JavaScript');
    await user.click(subredditItems[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/home?subreddit=sub123');
  });

  it('should limit hot communities to 5 items', () => {
    const mockSubreddits = Array.from({ length: 10 }, (_, i) => ({
      _id: `${i + 1}`,
      name: `Subreddit${i + 1}`,
      description: `Description ${i + 1}`,
    }));

    const store = createMockStore({
      subreddits: mockSubreddits,
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    // Hot communities section should show max 5 items
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.queryByText('#6')).not.toBeInTheDocument();
  });

  it('should sort hot communities alphabetically', () => {
    const mockSubreddits = [
      { _id: '1', name: 'Zebra', description: 'Z' },
      { _id: '2', name: 'Apple', description: 'A' },
      { _id: '3', name: 'Mango', description: 'M' },
    ];

    const store = createMockStore({
      subreddits: mockSubreddits,
      loading: false,
      error: null,
    });

    renderWithProviders(store);

    const hotCommunities = screen.getAllByText(/^r\//);
    // First 3 items should be sorted alphabetically
    expect(hotCommunities[0].textContent).toBe('r/Apple');
    expect(hotCommunities[1].textContent).toBe('r/Mango');
    expect(hotCommunities[2].textContent).toBe('r/Zebra');
  });
});
