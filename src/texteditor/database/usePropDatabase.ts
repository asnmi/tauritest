import { invoke } from '@tauri-apps/api/tauri';

interface PropsJson {
    id: number,
    key: string,
    value: string,
    bloc_id: number,
}

export const newProp = async (propJson: PropsJson): Promise<number> => {
  try {
    let id = await invoke('new_prop', { prop: propJson }) as number;
    return id;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const updatePropValue = async (blockId: number, key: string, value: string): Promise<boolean> => {
  try {
    let success = await invoke('update_prop_value', { blockId: blockId, key: key, value: value }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const deleteProp = async (blockId: number, key: string): Promise<boolean> => {
  try {
    let success = await invoke('delete_prop', { blockId: blockId, key: key }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const deletePropByBlocId = async (blockId: number): Promise<boolean> => {
  try {
    let success = await invoke('delete_prop_by_bloc_id', { blockId: blockId }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const getPropsByBlocId = async (blockId: number): Promise<PropsJson[]> => {
  try {
    let props = await invoke('get_props_by_bloc_id', { blockId: blockId }) as PropsJson[];
    return props;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const getPropsByKey = async (key: string): Promise<PropsJson> => {
  try {
    let props = await invoke('get_props_by_key', { key: key }) as PropsJson;
    return props;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export const changePropKeyName = async (key: string, newKey: string): Promise<boolean> => {
  try {
    let success = await invoke('change_prop_key_name', { key: key, newKey: newKey }) as boolean;
    return success;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
