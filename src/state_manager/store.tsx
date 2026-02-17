// src/state_manager/store.tsx
import { configureStore } from '@reduxjs/toolkit';
import menuReducer from './menu_slice';
import navigationReducer from './navigation_slice';

const store = configureStore({
  reducer: {
    menu: menuReducer,
    navigation: navigationReducer
  },
});

// Typage pour le type RootState
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store };