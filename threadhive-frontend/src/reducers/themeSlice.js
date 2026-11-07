import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: localStorage.getItem('darkMode') === 'true' || false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggle: (state) => {
      state.darkMode = !state.darkMode;
    },
    set: (state, action) => {
      state.darkMode = action.payload;
    },
  },
});

// Thunk: toggle dark mode — persists to localStorage then updates Redux state
export const toggleDarkMode = () => (dispatch, getState) => {
  const newMode = !getState().theme.darkMode;
  localStorage.setItem('darkMode', newMode);
  dispatch(themeSlice.actions.toggle());
};

// Thunk: set dark mode — persists to localStorage then updates Redux state
export const setDarkMode = (value) => (dispatch) => {
  localStorage.setItem('darkMode', value);
  dispatch(themeSlice.actions.set(value));
};

export default themeSlice.reducer;
