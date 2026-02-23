import { invoke } from '@tauri-apps/api/tauri';

export interface BlocJson {
    id: string,
    position: string,
    content: string,
    page_id: string,
    bloc_type: string,
    created_at: number,
    updated_at: number,
}

export const SUCCESS: number = 1;
export const ERROR: number = -1;
export const NO_CHANGE: number = 0;

export const newBloc = async (blocJson: BlocJson): Promise<string> => {
  try {
    let id = await invoke('new_bloc', { bloc: blocJson }) as string;
    return id;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updateBloc = async (blocJson: BlocJson): Promise<boolean> => {
  try {
    let success = await invoke('update_bloc', { bloc: blocJson }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updateBlocContent = async (
  id: string,
  newContent: string,
  updatedAt: number
): Promise<number> => {
  try {
    let success = await invoke('update_bloc_content', { id: id, newContent: newContent, updatedAt: updatedAt }) as number;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updateBlocPosition = async (
  id: string,
  newPosition: string,
  updatedAt: number
): Promise<number> => {
  try {
    let success = await invoke('update_bloc_position', { id: id, newPosition: newPosition, updatedAt: updatedAt }) as number;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updateBlocPageId = async (id: string, newPageId: string): Promise<boolean> => {
  try {
    let success = await invoke('update_bloc_page_id', { id: id, newPageId: newPageId }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const deleteBloc = async (id: string): Promise<boolean> => {
  try {
    let success = await invoke('delete_bloc', { id: id }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const deleteBlocByPageId = async (pageId: string): Promise<boolean> => {
  try {
    let success = await invoke('delete_bloc_by_page_id', { pageId: pageId }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const getChecksum = async (id: string): Promise<string> => {
  try {
    let checksum = await invoke('get_checksum', { id: id }) as string;
    return checksum;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const getBlocById = async (id: string): Promise<BlocJson> => {
  try {
    let bloc = await invoke('get_bloc_by_id', { id: id }) as BlocJson;
    return bloc;
  } catch (error) {
    console.warn('Failed to get bloc by id:', error);
    return null as any;
  }
}

export const getBlocsByPageId = async (pageId: string): Promise<BlocJson[]> => {
  try {
    let blocs = await invoke('get_blocs_by_page_id', { pageId: pageId }) as BlocJson[];
    return blocs;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
