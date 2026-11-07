// features/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login, register } from "../services/authService.js";

const initialState = {
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
  login: {
    status: "idle", // 'idle' | 'pending' | 'fulfilled' | 'rejected'
    error: null,
  },
  registration: {
    status: "idle", // 'idle' | 'pending' | 'fulfilled' | 'rejected'
    error: null,
  },
};

// Async thunk: login — localStorage side effects kept out of reducers
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await login(credentials);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  },
);

// Async thunk: register
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, { rejectWithValue }) => {
    try {
      return await register(formData);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed",
      );
    }
  },
);

// Thunk: logout — clears localStorage then resets Redux state
export const logoutUser = () => (dispatch) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  dispatch(authSlice.actions.logout());
};

// Thunk: update user locally — persists to localStorage then updates Redux state
export const saveUser = (userData) => (dispatch) => {
  localStorage.setItem("user", JSON.stringify(userData));
  dispatch(authSlice.actions.setUser(userData));
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.login = { status: "idle", error: null };
      state.registration = { status: "idle", error: null };
    },
    clearAuthState: (state) => {
      state.login.error = null;
      state.login.status = "idle";
      state.registration.error = null;
      state.registration.status = "idle";
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, (state) => {
        state.login.status = "pending";
        state.login.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.login.status = "fulfilled";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.status = "rejected";
        state.login.error = action.payload || action.error.message;
      })

      // register
      .addCase(registerUser.pending, (state) => {
        state.registration.status = "pending";
        state.registration.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.registration.status = "fulfilled";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registration.status = "rejected";
        state.registration.error = action.payload || action.error.message;
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
