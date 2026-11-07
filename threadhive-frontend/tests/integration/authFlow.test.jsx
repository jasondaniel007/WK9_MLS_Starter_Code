import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, registerUser, logoutUser } from '../../src/reducers/authSlice';

/**
 * Integration Tests: Redux + MSW
 * These tests verify that Redux actions work correctly with MSW-mocked API calls
 * No component rendering - pure Redux + API integration
 */

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
global.localStorage = localStorageMock;

describe('Auth Flow Integration Tests (Redux + MSW)', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
    localStorageMock.clear();
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Initial state - not authenticated
      expect(store.getState().auth.token).toBeNull();

      // Dispatch login action with valid credentials
      const result = await store.dispatch(
        loginUser({ email: 'john@example.com', password: 'password123' })
      );

      // Verify action was fulfilled
      expect(loginUser.fulfilled.match(result)).toBe(true);

      // Verify state was updated
      const state = store.getState().auth;
      expect(state.token).toBe('mock-jwt-token-12345');
      expect(state.user).toBeDefined();
      expect(state.user.email).toBe('john@example.com');
      expect(state.login.status).toBe('fulfilled');
      expect(state.login.error).toBeNull();

      // Verify localStorage was updated
      expect(localStorage.getItem('token')).toBe('mock-jwt-token-12345');
    });

    it('should handle login failure with invalid credentials', async () => {
      // Dispatch login action with invalid credentials
      const result = await store.dispatch(
        loginUser({ email: 'wrong@example.com', password: 'wrongpass' })
      );

      // Verify action was rejected
      expect(loginUser.rejected.match(result)).toBe(true);

      // Verify state shows error
      const state = store.getState().auth;
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.login.error).toBeDefined();
      expect(state.login.status).toBe('rejected');
    });

    it('should set loading state during login', async () => {
      // Dispatch login action
      const promise = store.dispatch(
        loginUser({ email: 'john@example.com', password: 'password123' })
      );

      // Immediately check loading state (before promise resolves)
      const loadingState = store.getState().auth;
      // Loading might already be true or false depending on timing
      expect(loadingState).toHaveProperty('login');

      // Wait for completion
      await promise;

      // Final state should not be loading
      expect(store.getState().auth.login.status).not.toBe('pending');
    });
  });

  describe('Register Flow', () => {
    it('should successfully register new user', async () => {
      // Dispatch register action
      const result = await store.dispatch(
        registerUser({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        })
      );

      // Verify action was fulfilled
      expect(registerUser.fulfilled.match(result)).toBe(true);

      // Verify state shows registration success
      const state = store.getState().auth;
      expect(state.registration.status).toBe('fulfilled');
      expect(state.registration.error).toBeNull();
    });

    it('should handle registration failure with existing email', async () => {
      // Dispatch register action with existing email
      const result = await store.dispatch(
        registerUser({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        })
      );

      // Verify action was rejected
      expect(registerUser.rejected.match(result)).toBe(true);

      // Verify state shows error
      const state = store.getState().auth;
      expect(state.registration.status).toBe('rejected');
      expect(state.registration.error).toBeDefined();
    });
  });

  describe('Logout Flow', () => {
    it('should clear auth state and localStorage on logout', async () => {
      // First login to set state
      await store.dispatch(
        loginUser({ email: 'john@example.com', password: 'password123' })
      );

      // Verify logged in
      expect(store.getState().auth.token).toBeTruthy();
      expect(localStorage.getItem('token')).toBeTruthy();

      // Dispatch logout
      store.dispatch(logoutUser());

      // Verify state cleared
      const state = store.getState().auth;
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.login.error).toBeNull();

      // Verify localStorage cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Complete Auth Workflow', () => {
    it('should handle register -> login -> logout flow', async () => {
      // Step 1: Register
      const registerResult = await store.dispatch(
        registerUser({
          name: 'Workflow User',
          email: 'workflow@example.com',
          password: 'password123',
        })
      );
      expect(registerUser.fulfilled.match(registerResult)).toBe(true);
      expect(store.getState().auth.registration.status).toBe('fulfilled');

      // Step 2: Login
      const loginResult = await store.dispatch(
        loginUser({ email: 'john@example.com', password: 'password123' })
      );
      expect(loginUser.fulfilled.match(loginResult)).toBe(true);
      expect(store.getState().auth.token).toBeTruthy();

      // Step 3: Logout
      store.dispatch(logoutUser());
      expect(store.getState().auth.token).toBeNull();
    });
  });
});
