import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import userReducer from './slices/userSlice';

/**
 * Global Redux store configuration.
 * Disables serializable check to prevent warnings with Next.js router or complex objects.
 */
export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/** Type definition for the entire Redux state tree */
export type RootState = ReturnType<typeof store.getState>;

/** Type definition for the Redux dispatch function */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed custom hook for accessing the dispatch function.
 * Use this instead of `useDispatch` throughout the app for type safety.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed custom hook for accessing the global state.
 * Use this instead of `useSelector` throughout the app for type safety.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
