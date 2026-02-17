import { 
  newPage,
  updatePage,
  updatePagePath,
  updatePageTitle,
  updatePageCache,
  getPageCache,
  updatePageUpdatedAt,
  deletePage,
  getPagesByPath
} from '../../texteditor/database/usePageDatabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}));

const mockPage = {
  id: '1',
  path: '/test',
  title: 'Test Page',
  cache: '{}',
  created_at: Date.now(),
  updated_at: Date.now()
};

describe('usePageDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('newPage', () => {
    it('should create a new page', async () => {
      (invoke as any).mockResolvedValueOnce('123');
      const result = await newPage(mockPage);
      expect(invoke).toHaveBeenCalledWith('new_page', { page: mockPage });
      expect(result).toBe('123');
    });
  });

  describe('updatePage', () => {
    it('should update a page', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updatePage(mockPage);
      expect(invoke).toHaveBeenCalledWith('update_page', { page: mockPage });
      expect(result).toBe(true);
    });
  });

  // Tests pour les autres fonctions...
  describe('updatePagePath', () => {
    it('should update a page path', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updatePagePath(mockPage.id, '/new-path');
      expect(invoke).toHaveBeenCalledWith('update_page_path', { id: mockPage.id, path: '/new-path' });
      expect(result).toBe(true);
    });
  });

  describe('updatePageTitle', () => {
    it('should update a page title', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updatePageTitle(mockPage.id, 'New Title');
      expect(invoke).toHaveBeenCalledWith('update_page_title', { id: mockPage.id, title: 'New Title' });
      expect(result).toBe(true);
    });
  });

  describe('updatePageCache', () => {
    it('should update a page cache', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await updatePageCache(mockPage.id, '{aaa}');
      expect(invoke).toHaveBeenCalledWith('update_page_cache', { id: mockPage.id, cache: '{aaa}'});
      expect(result).toBe(true);
    });
  });

  describe('getPageCache', () => {
    it('should get a page cache', async () => {
      (invoke as any).mockResolvedValueOnce(mockPage.cache);
      const result = await getPageCache(mockPage.id);
      expect(invoke).toHaveBeenCalledWith('get_page_cache', { id: mockPage.id });
      expect(result).toBe(mockPage.cache);
    });
  });

describe('updatePageUpdatedAt', () => {
  it('should update a page updated_at', async () => {
    const updatedAt = Date.now();
    (invoke as any).mockResolvedValueOnce(true);
    const result = await updatePageUpdatedAt(mockPage.id, updatedAt);
    expect(invoke).toHaveBeenCalledWith('update_page_updated_at', { 
      id: mockPage.id, 
      updated_at: updatedAt 
    });
    expect(result).toBe(true);
  });
});

  describe('deletePage', () => {
    it('should delete a page', async () => {
      (invoke as any).mockResolvedValueOnce(true);
      const result = await deletePage(mockPage.id);
      expect(invoke).toHaveBeenCalledWith('delete_page', { id: mockPage.id });
      expect(result).toBe(true);
    });
  });

  describe('getPagesByPath', () => {
    it('should get pages by path', async () => {
      (invoke as any).mockResolvedValueOnce([mockPage]);
      const result = await getPagesByPath('/test');
      expect(invoke).toHaveBeenCalledWith('get_pages_by_path', { path: '/test' });
      expect(result).toEqual([mockPage]);
    });
  });
});