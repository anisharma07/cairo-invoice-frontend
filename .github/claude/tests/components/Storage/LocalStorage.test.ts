import { describe, it, expect, vi, beforeEach } from 'vitest';
import { File, Local } from '../../../src/components/Storage/LocalStorage';
import { Preferences } from '@capacitor/preferences';

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(),
    keys: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockPreferences = vi.mocked(Preferences);

describe('LocalStorage', () => {
  let localStorage: Local;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage = new Local();
  });

  describe('File class', () => {
    it('creates file instance correctly', () => {
      const file = new File(
        '2023-01-01',
        '2023-01-02',
        'test content',
        'test-file',
        1,
        false
      );

      expect(file.created).toBe('2023-01-01');
      expect(file.modified).toBe('2023-01-02');
      expect(file.content).toBe('test content');
      expect(file.name).toBe('test-file');
      expect(file.billType).toBe(1);
      expect(file.isEncrypted).toBe(false);
    });

    it('creates encrypted file instance', () => {
      const file = new File(
        '2023-01-01',
        '2023-01-02',
        'test content',
        'test-file',
        1,
        true,
        'password123'
      );

      expect(file.isEncrypted).toBe(true);
      expect(file.password).toBe('password123');
    });
  });

  describe('_saveFile', () => {
    it('saves unencrypted file', async () => {
      const file = new File(
        '2023-01-01',
        '2023-01-02',
        'test content',
        'test-file',
        1,
        false
      );

      await localStorage._saveFile(file);

      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'test-file',
        value: JSON.stringify({
          created: '2023-01-01',
          modified: '2023-01-02',
          content: 'test content',
          name: 'test-file',
          billType: 1,
          isEncrypted: false,
        }),
      });
    });

    it('saves encrypted file', async () => {
      const file = new File(
        '2023-01-01',
        '2023-01-02',
        'test content',
        'test-file',
        1,
        true,
        'password123'
      );

      await localStorage._saveFile(file);

      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'test-file',
        value: expect.stringContaining('"isEncrypted":true'),
      });

      // Verify content is encrypted (not plain text)
      const savedData = JSON.parse(mockPreferences.set.mock.calls[0][0].value);
      expect(savedData.content).not.toBe('test content');
      expect(savedData.isEncrypted).toBe(true);
    });
  });

  describe('_getFile', () => {
    it('retrieves file successfully', async () => {
      const fileData = {
        created: '2023-01-01',
        modified: '2023-01-02',
        content: 'test content',
        name: 'test-file',
        billType: 1,
        isEncrypted: false,
      };

      mockPreferences.get.mockResolvedValue({
        value: JSON.stringify(fileData),
      });

      const result = await localStorage._getFile('test-file');

      expect(result).toEqual(fileData);
      expect(mockPreferences.get).toHaveBeenCalledWith({ key: 'test-file' });
    });
  });

  describe('_getFileWithPassword', () => {
    it('retrieves unencrypted file without password', async () => {
      const fileData = {
        created: '2023-01-01',
        modified: '2023-01-02',
        content: 'test content',
        name: 'test-file',
        billType: 1,
        isEncrypted: false,
      };

      mockPreferences.get.mockResolvedValue({
        value: JSON.stringify(fileData),
      });

      const result = await localStorage._getFileWithPassword('test-file', 'password');

      expect(result).toEqual(fileData);
    });

    it('retrieves encrypted file with correct password', async () => {
      // First save an encrypted file to get the encrypted content
      const originalFile = new File(
        '2023-01-01',
        '2023-01-02',
        'test content',
        'test-file',
        1,
        true,
        'password123'
      );

      await localStorage._saveFile(originalFile);

      // Get the encrypted data that was saved
      const encryptedData = JSON.parse(mockPreferences.set.mock.calls[0][0].value);

      // Mock the get to return the encrypted data
      mockPreferences.get.mockResolvedValue({
        value: JSON.stringify(encryptedData),
      });

      const result = await localStorage._getFileWithPassword('test-file', 'password123');

      expect(result.content).toBe('test content');
      expect(result.isEncrypted).toBe(true);
    });

    it('throws error with incorrect password', async () => {
      const encryptedData = {
        created: '2023-01-01',
        modified: '2023-01-02',
        content: 'U2FsdGVkX1+invalid_encrypted_content',
        name: 'test-file',
        billType: 1,
        isEncrypted: true,
      };

      mockPreferences.get.mockResolvedValue({
        value: JSON.stringify(encryptedData),
      });

      await expect(
        localStorage._getFileWithPassword('test-file', 'wrong-password')
      ).rejects.toThrow('Incorrect password or corrupted file');
    });
  });

  describe('_getAllFiles', () => {
    it('retrieves all files', async () => {
      const fileData1 = {
        created: '2023-01-01',
        modified: '2023-01-02',
        content: 'content1',
        name: 'file1',
        billType: 1,
        isEncrypted: false,
      };

      const fileData2 = {
        created: '2023-01-03',
        modified: '2023-01-04',
        content: 'content2',
        name: 'file2',
        billType: 2,
        isEncrypted: false,
      };

      mockPreferences.keys.mockResolvedValue({ keys: ['file1', 'file2'] });
      mockPreferences.get
        .mockResolvedValueOnce({ value: JSON.stringify(fileData1) })
        .mockResolvedValueOnce({ value: JSON.stringify(fileData2) });

      const result = await localStorage._getAllFiles();

      expect(result).toEqual({
        file1: {
          created: '2023-01-01',
          modified: '2023-01-02',
          name: 'file1',
          billType: 1,
          isEncrypted: false,
        },
        file2: {
          created: '2023-01-03',
          modified: '2023-01-04',
          name: 'file2',
          billType: 2,
          isEncrypted: false,
        },
      });
    });
  });

  describe('_deleteFile', () => {
    it('deletes file successfully', async () => {
      await localStorage._deleteFile('test-file');

      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: 'test-file' });
    });
  });

  describe('_checkKey', () => {
    it('returns true when key exists', async () => {
      mockPreferences.get.mockResolvedValue({ value: 'some value' });

      const result = await localStorage._checkKey('test-file');

      expect(result).toBe(true);
    });

    it('returns false when key does not exist', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const result = await localStorage._checkKey('test-file');

      expect(result).toBe(false);
    });
  });
});