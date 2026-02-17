import { 
  newProp,
  updatePropValue,
  deleteProp,
  deletePropByBlocId,
  getPropsByBlocId,
  getPropsByKey,
  changePropKeyName
} from '../../texteditor/database/usePropDatabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}));

const mockProp = {
  id: 1,
  key: 'testKey',
  value: 'testValue',
  bloc_id: 1
};

describe('usePropDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('newProp', () => {
    it('should create a new prop', async () => {
      (invoke as any).mockResolvedValueOnce(123);
      const result = await newProp(mockProp);
      expect(invoke).toHaveBeenCalledWith('new_prop', { prop: mockProp });
      expect(result).toBe(123);
    });
  });

  // Tests pour les autres fonctions...
  describe('updatePropValue', () => {
    it('should update a prop value', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updatePropValue(mockProp.bloc_id, 'testKey', 'new value');
      expect(invoke).toHaveBeenCalledWith('update_prop_value', { bloc_id: mockProp.bloc_id, key: 'testKey', value: 'new value' });
      expect(result).toBe(true);
    });
  });

  describe('deleteProp', () => {
    it('should delete a prop', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await deleteProp(mockProp.bloc_id, 'testKey');
      expect(invoke).toHaveBeenCalledWith('delete_prop', { bloc_id: mockProp.bloc_id, key: 'testKey' });
      expect(result).toBe(true);
    });
  });

  describe('deletePropByBlocId', () => {
    it('should delete props by bloc id', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await deletePropByBlocId(mockProp.bloc_id);
      expect(invoke).toHaveBeenCalledWith('delete_prop_by_bloc_id', { bloc_id: mockProp.bloc_id });
      expect(result).toBe(true);
    });
  });

  describe('getPropsByBlocId', () => {
    it('should get props by bloc id', async () => {
      (invoke as any).mockResolvedValueOnce([mockProp]);
      const result = await getPropsByBlocId(mockProp.bloc_id);
      expect(invoke).toHaveBeenCalledWith('get_props_by_bloc_id', { bloc_id: mockProp.bloc_id });
      expect(result).toEqual([mockProp]);
    });
  });

  describe('getPropsByKey', () => {
    it('should get props by key', async () => {
      (invoke as any).mockResolvedValueOnce([mockProp]);
      const result = await getPropsByKey('testKey');
      expect(invoke).toHaveBeenCalledWith('get_props_by_key', { key: 'testKey' });
      expect(result).toEqual([mockProp]);
    });
  });

  describe('changePropKeyName', () => {
    it('should change a prop key name and verify the change', async () => {
      const oldKey = 'testKey';
      const newKey = 'newKey';
      const updatedProp = { ...mockProp, key: newKey };

      // Mock du premier appel (changement de la clé)
      (invoke as any).mockResolvedValueOnce(true);
      // Mock du deuxième appel (vérification de la mise à jour)
      (invoke as any).mockResolvedValueOnce([updatedProp]);

      // 1. Changer la clé
      const result = await changePropKeyName(oldKey, newKey);
      
      // 2. Vérifier que la fonction a été appelée correctement
      expect(invoke).toHaveBeenNthCalledWith(1, 'change_prop_key_name', { 
        key: oldKey, 
        new_key: newKey  // Note: utilisez 'new_key' au lieu de 'newKey' si c'est ce qu'attend le backend
      });
      expect(result).toBe(true);

      // 3. Vérifier que la clé a été mise à jour dans la base de données
      const propsAfterUpdate = await getPropsByKey(newKey);
      expect(invoke).toHaveBeenNthCalledWith(2, 'get_props_by_key', { 
        key: newKey 
      });
      expect(propsAfterUpdate).toEqual([updatedProp]);
    });
  });
});