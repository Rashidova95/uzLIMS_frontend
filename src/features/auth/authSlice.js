import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

const storedUser = localStorage.getItem('chemlab_user');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: localStorage.getItem('chemlab_access_token') || null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const tokens = await authService.login(email, password);
      localStorage.setItem('chemlab_access_token', tokens.access);
      localStorage.setItem('chemlab_refresh_token', tokens.refresh);
      const me = await authService.getMe();
      localStorage.setItem('chemlab_user', JSON.stringify(me));
      return { user: me, accessToken: tokens.access };
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Email yoki parol noto\'g\'ri';
      return rejectWithValue(detail);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const me = await authService.getMe();
      localStorage.setItem('chemlab_user', JSON.stringify(me));
      return me;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      localStorage.removeItem('chemlab_access_token');
      localStorage.removeItem('chemlab_refresh_token');
      localStorage.removeItem('chemlab_user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;

// ---- Selektorlar ----
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
export const selectUserRole = (state) => state.auth.user?.profile?.role || state.auth.user?.role;

export default authSlice.reducer;
