import { invoke } from '@tauri-apps/api/tauri';

export interface PageJson {
    id: string,
    path: string,
    title: string,
    cache: string,
    created_at: number,
    updated_at: number,
}

export const newPage = async (pageJson: PageJson): Promise<string> => {
  try {
    let id = await invoke('new_page', { page: pageJson }) as string;
    return id;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updatePage = async (pageJson: PageJson): Promise<boolean> => {
  try {
    let success = await invoke('update_page', { page: pageJson }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updatePagePath = async (id: string, path: string): Promise<boolean> => {
  try {
    let success = await invoke('update_page_path', { id: id, path: path }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updatePageTitle = async (id: string, title: string): Promise<boolean> => {
  try {
    let success = await invoke('update_page_title', { id: id, title: title }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updatePageCache = async (id: string, cache: string): Promise<boolean> => {
  try {
    let success = await invoke('update_page_cache', { id: id, cache: cache }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const getPageCache = async (id: string): Promise<string> => {
  try {
    let cache = await invoke('get_page_cache', { id: id }) as string;
    return cache;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updatePageUpdatedAt = async (id: string, updatedAt: number): Promise<boolean> => {
  try {
    let success = await invoke('update_page_updated_at', { id: id, updatedAt: updatedAt }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const deletePage = async (id: string): Promise<boolean> => {
  try {
    let success = await invoke('delete_page', { id: id }) as boolean;
    return success;
  } catch (error) {
    console.error('deletePage Failed:', error);
    throw error;
  }
}

export const getPagesByPath = async (path: string): Promise<PageJson[]> => {
  try {
    let pages = await invoke('get_pages_by_path', { path: path }) as PageJson[];
    return pages;
  } catch (error) {
    console.error('getPagesByPath Failed:', error);
    throw error;
  }
}