// src/store/menuSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
  name: 'modifification_state',
  initialState: { open: false },
  reducers: {
    openMenuX: state => { state.open = true; },
    closeMenuX: state => { state.open = false; },
    toggleMenuX: state => { state.open = !state.open; }
  }
});

export const { openMenuX, closeMenuX, toggleMenuX } = menuSlice.actions;
export default menuSlice.reducer;