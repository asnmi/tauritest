// src/hooks/useDatabase.ts
import { invoke } from '@tauri-apps/api/tauri';

export const initDatabase = async (dbPath: string) => {
  try {
    // Check if we're in a Tauri environment
    if (typeof window !== 'undefined' && window.__TAURI__) {
      await invoke('init_db', { dbPath });
      return true;
    } else {
      // In browser environment, just log and continue
      console.log('Database initialization skipped - not in Tauri environment');
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Don't throw error in browser environment
    if (typeof window !== 'undefined' && window.__TAURI__) {
      throw error;
    }
    return true;
  }
}
