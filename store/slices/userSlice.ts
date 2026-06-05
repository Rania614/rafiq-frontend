import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  data: {
    email: string;
    raw_user_meta_data: {
      name: string;
      job_title?: string;
    };
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/auth/v1/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: 'YOUR_API_KEY',
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Something went wrong');
    }
  }
);

export const logoutUser = createAsyncThunk('user/logoutUser', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('access_token');

    const response = await fetch('/auth/v1/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: 'YOUR_API_KEY',
        Authorization: `Bearer ${token || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed, please try again.');
    }

    return true;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Logout failed, please try again.');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.data = null;
      state.error = null;
    },
    updateUserMetadata: (state, action: PayloadAction<{ name: string; job_title?: string }>) => {
      if (state.data) {
        state.data.raw_user_meta_data = {
          ...state.data.raw_user_meta_data,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearUser, updateUserMetadata } = userSlice.actions;
export default userSlice.reducer;
