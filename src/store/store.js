import { configureStore } from '@reduxjs/toolkit';
import applicationsReducer from './applicationsSlice';
import { STORAGE_KEY } from '../utils/constants';

export const store = configureStore({
  reducer: {
    applications: applicationsReducer,
  },
});

// Persist to localStorage whenever the applications state changes.
let previous = store.getState().applications;
store.subscribe(() => {
  const current = store.getState().applications;
  if (current !== previous) {
    previous = current;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      /* storage full or blocked */
    }
  }
});
