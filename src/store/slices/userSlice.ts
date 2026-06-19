import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAccessToken, clearAuthSession, normalizeUserProfile } from '@/utils/auth';
import { supabaseAuthHeaders, supabaseAuthUrl } from '@/utils/supabase';

/**
 * Structure of the user state maintained in the Redux store.
 */
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

/**
 * Async thunk that fetches the current authenticated user's profile from Supabase.
 * Uses the locally stored access token to authenticate the request.
 */
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken();
      const response = await fetch(supabaseAuthUrl('/auth/v1/user'), {
        method: 'GET',
        headers: supabaseAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      return normalizeUserProfile(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Something went wrong');
    }
  }
);

/**
 * Async thunk that handles the user logout process.
 * Attempts to invalidate the session on the server before clearing local session data.
 */
export const logoutUser = createAsyncThunk('user/logoutUser', async () => {
  const token = getAccessToken();

  if (token) {
    try {
      await fetch(supabaseAuthUrl('/auth/v1/logout'), {
        method: 'POST',
        headers: supabaseAuthHeaders(token),
        body: JSON.stringify({ scope: 'local' }),
      });
    } catch {
      // Network error — local session will still be cleared below
    }
  }

  clearAuthSession();
  return true;
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Resets the user state to its initial null/empty values */
    clearUser: (state) => {
      state.data = null;
      state.error = null;
    },
    /**
     * Updates specific fields within the user's raw metadata.
     * Useful when the user edits their profile information locally without needing a full re-fetch.
     */
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
