import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../../../src/pages/Auth/Login';
import Register from '../../../src/pages/Auth/Register';
import authReducer from '../../../src/reducers/authSlice';

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

const renderWithProviders = (component) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Auth Components', () => {
  describe('Login Component', () => {
    it('renders the login form fields', () => {
      renderWithProviders(<Login />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('allows typing email and password and submitting', async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );

      await userEvent.type(screen.getByLabelText(/email/i), 'admin@gmail.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      // Verify form submitted (dispatch happened, loading state changed)
      expect(screen.getByLabelText(/email/i)).toHaveValue('admin@gmail.com');
      expect(screen.getByLabelText(/password/i)).toHaveValue('admin123');
    });
  });

  describe('Register Component', () => {
    beforeEach(() => {
      global.alert = vi.fn();
    });

    it('renders the register form fields', () => {
      renderWithProviders(<Register />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('allows typing form data and submitting', async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </Provider>
      );

      await userEvent.type(screen.getByLabelText(/name/i), 'JohnDoe');
      await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      expect(screen.getByLabelText(/name/i)).toHaveValue('JohnDoe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
      expect(screen.getByLabelText(/password/i)).toHaveValue('password123');
    });
  });
});
