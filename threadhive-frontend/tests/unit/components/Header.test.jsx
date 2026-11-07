import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../../../src/components/Header/Header';
import themeReducer from '../../../src/reducers/themeSlice';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = ({ token = null, user = null, darkMode = false } = {}) => {
  return configureStore({
    reducer: {
      auth: () => ({ token, user, login: { status: 'idle', error: null }, registration: { status: 'idle', error: null } }),
      theme: () => ({ darkMode }),
    },
  });
};

const renderHeader = (storeOptions = {}) => {
  const store = createMockStore(storeOptions);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Header onToggleSidebar={vi.fn()} />
      </BrowserRouter>
    </Provider>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the logo', () => {
    renderHeader();
    expect(screen.getByText('ThreadHive')).toBeInTheDocument();
  });

  it('shows login and register buttons when not authenticated', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('calls onNavigate with "login" when login button is clicked', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('calls onNavigate with "register" when register button is clicked', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('renders dark mode toggle button', () => {
    renderHeader();
    expect(screen.getByLabelText(/toggle dark mode/i)).toBeInTheDocument();
  });

  it('displays moon emoji when dark mode is off', () => {
    renderHeader({ darkMode: false });
    expect(screen.getByLabelText(/toggle dark mode/i)).toHaveTextContent('\u{1F319}');
  });

  it('displays sun emoji when dark mode is on', () => {
    renderHeader({ darkMode: true });
    expect(screen.getByLabelText(/toggle dark mode/i)).toHaveTextContent('\u2600');
  });

  it('calls onToggleDarkMode when dark mode button is clicked', async () => {
    const store = configureStore({
      reducer: {
        auth: () => ({ token: null, user: null, login: { status: 'idle', error: null }, registration: { status: 'idle', error: null } }),
        theme: themeReducer,
      },
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header onToggleSidebar={vi.fn()} />
        </BrowserRouter>
      </Provider>
    );

    await userEvent.click(screen.getByLabelText(/toggle dark mode/i));
    expect(store.getState().theme.darkMode).toBe(true);
  });
});
