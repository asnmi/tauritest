// src/state_manager/navigation_slice.tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Page = 
  'home' 
  | 'editor' 
  | 'history' 
  | 'schedule' 
  | 'todolist' 
  | 'reorderablelist' 
  | 'kanban'
  | 'search';

interface NavigationState {
  currentPage: Page;
}

const initialState: NavigationState = {
  currentPage: 'home',
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    navigateTo: (state, action: PayloadAction<Page>) => {
      state.currentPage = action.payload;
    },
  },
});

export const { navigateTo } = navigationSlice.actions;
export const selectCurrentPage = (state: { navigation: NavigationState }) => state.navigation.currentPage;

export default navigationSlice.reducer;