import { initDatabase } from '../../texteditor/database/useDatabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

// Mock de la fonction invoke de Tauri
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}));

describe('useDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize database successfully', async () => {
    // Arrange
    const mockDbPath = 'test.db';
    (invoke as any).mockResolvedValueOnce(undefined);

    // Act
    const result = await initDatabase(mockDbPath);

    // Assert
    expect(invoke).toHaveBeenCalledWith('init_db', { dbPath: mockDbPath });
    expect(result).toBe(true);
  });

  it('should throw an error when database initialization fails', async () => {
    // Arrange
    const mockDbPath = 'H:/files/test.db';
    const mockError = new Error('Failed to initialize database');
    (invoke as any).mockRejectedValueOnce(mockError);

    // Act & Assert
    await expect(initDatabase(mockDbPath)).rejects.toThrow('Failed to initialize database');
    expect(invoke).toHaveBeenCalledWith('init_db', { dbPath: mockDbPath });
  });
});