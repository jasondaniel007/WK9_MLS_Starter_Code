import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PrivateRoute from '../../../src/components/PrivateRoute/PrivateRoute';
import authReducer from '../../../src/reducers/authSlice';

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate">{`Redirected to ${to}`}</div>),
  };
});

const createMockStore = (authState) => {
  return configureStore({
    reducer: {
      auth: () => authState,
    },
  });
};

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('PrivateRoute', () => {
  it('should render children when user is authenticated', () => {
    const store = createMockStore({ token: 'valid-token', user: { id: '123' } });

    renderWithProviders(
      <PrivateRoute>
        <div data-testid="protected-content">Protected Content</div>
      </PrivateRoute>,
      store
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to /login when user is not authenticated (no token)', () => {
    const store = createMockStore({ token: null, user: null });

    renderWithProviders(
      <PrivateRoute>
        <div data-testid="protected-content">Protected Content</div>
      </PrivateRoute>,
      store
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirected to /login')).toBeInTheDocument();
  });

  it('should redirect to /login when token is empty string', () => {
    const store = createMockStore({ token: '', user: null });

    renderWithProviders(
      <PrivateRoute>
        <div data-testid="protected-content">Protected Content</div>
      </PrivateRoute>,
      store
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });

  it('should render any valid React children when authenticated', () => {
    const store = createMockStore({ token: 'valid-token' });

    renderWithProviders(
      <PrivateRoute>
        <div>
          <h1>Dashboard</h1>
          <p>User dashboard content</p>
        </div>
      </PrivateRoute>,
      store
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('User dashboard content')).toBeInTheDocument();
  });
});
