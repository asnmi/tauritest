import { 
  newBloc,
  updateBloc,
  updateBlocContent, 
  updateBlocPosition, 
  updateBlocPageId, 
  deleteBloc, 
  deleteBlocByPageId, 
  getBlocById, 
  getBlocsByPageId,
  SUCCESS,
  ERROR,
  NO_CHANGE
} from '../../texteditor/database/useBlocDatabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

// Mock de la fonction invoke de Tauri
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}));

const mockBloc = {
  id: '1',
  position: '1',
  content: 'Test content',
  page_id: '1',
  bloc_type: 'text',
  created_at: Date.now(),
  updated_at: Date.now()
};

describe('useBlocDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('newBloc', () => {
    it('should create a new bloc', async () => {
      (invoke as any).mockResolvedValueOnce('123');
      const result = await newBloc(mockBloc);
      expect(invoke).toHaveBeenCalledWith('new_bloc', { bloc: mockBloc });
      expect(result).toBe('123');
    });
  });

  describe('updateBloc', () => {
    it('should update a bloc', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updateBloc(mockBloc);
      expect(invoke).toHaveBeenCalledWith('update_bloc', { bloc: mockBloc });
      expect(result).toBe(true);
    });
  });

  // Tests pour les autres fonctions...
  describe('updateBlocContent', () => {
    it('should update a bloc content', async () => {
      (invoke as any).mockResolvedValueOnce(SUCCESS);
      const result = await updateBlocContent(mockBloc.id, 'New content', mockBloc.updated_at);
      expect(invoke).toHaveBeenCalledWith('update_bloc_content', { id: mockBloc.id, new_content: 'New content', updated_at: mockBloc.updated_at });
      expect(result).toBe(SUCCESS);
    });
  });

  describe('updateBlocPosition', () => {
    it('should update a bloc position', async () => {
      (invoke as any).mockResolvedValueOnce(SUCCESS);
      const result = await updateBlocPosition(mockBloc.id, '2', mockBloc.updated_at);
      expect(invoke).toHaveBeenCalledWith('update_bloc_position', { id: mockBloc.id, new_position: '2', updated_at: mockBloc.updated_at });
      expect(result).toBe(SUCCESS);
    });
  });

  describe('updateBlocPageId', () => {
    it('should update a bloc page id', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updateBlocPageId(mockBloc.id, '2');
      expect(invoke).toHaveBeenCalledWith('update_bloc_page_id', { id: mockBloc.id, new_page_id: '2' });
      expect(result).toBe(true);
    });
  });

  describe('deleteBloc', () => {
    it('should delete a bloc', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await deleteBloc(mockBloc.id);
      expect(invoke).toHaveBeenCalledWith('delete_bloc', { id: mockBloc.id });
      expect(result).toBe(true);
    });
  });

  describe('deleteBlocByPageId', () => {
    it('should delete blocs by page id', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await deleteBlocByPageId(mockBloc.page_id);
      expect(invoke).toHaveBeenCalledWith('delete_bloc_by_page_id', { page_id: mockBloc.page_id });
      expect(result).toBe(true);
    });
  });

  describe('getBlocById', () => {
    it('should get a bloc by id', async () => {
      (invoke as any).mockResolvedValueOnce(mockBloc);
      const result = await getBlocById(mockBloc.id);
      expect(invoke).toHaveBeenCalledWith('get_bloc_by_id', { id: mockBloc.id });
      expect(result).toEqual(mockBloc);
    });
  });

  describe('getBlocsByPageId', () => {
    it('should get blocs by page id', async () => {
      (invoke as any).mockResolvedValueOnce([mockBloc]);
      const result = await getBlocsByPageId(mockBloc.page_id);
      expect(invoke).toHaveBeenCalledWith('get_blocs_by_page_id', { page_id: mockBloc.page_id });
      expect(result).toEqual([mockBloc]);
    });
  });
});