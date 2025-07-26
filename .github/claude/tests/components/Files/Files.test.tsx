import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Files from '../../../src/components/Files/Files';
import { Local } from '../../../src/components/Storage/LocalStorage';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useInvoice } from '../../../src/contexts/InvoiceContext';
import { useAccount } from '@starknet-react/core';

// Mock dependencies
vi.mock('../../../src/contexts/ThemeContext');
vi.mock('../../../src/contexts/InvoiceContext');
vi.mock('../../../src/components/Storage/LocalStorage');
vi.mock('@starknet-react/core');
vi.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: vi.fn(),
  }),
}));

const mockUseTheme = vi.mocked(useTheme);
const mockUseInvoice = vi.mocked(useInvoice);
const mockUseAccount = vi.mocked(useAccount);

describe('Files Component', () => {
  const mockStore = {
    _getAllFiles: vi.fn(),
    _getFile: vi.fn(),
    _deleteFile: vi.fn(),
    _checkKey: vi.fn(),
    _saveFile: vi.fn(),
  };

  const mockProps = {
    store: mockStore as any,
    file: 'test-file',
    updateSelectedFile: vi.fn(),
    updateBillType: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseTheme.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: vi.fn(),
    });

    mockUseInvoice.mockReturnValue({
      selectedFile: 'test-file',
      updateSelectedFile: vi.fn(),
      billType: 1,
      store: mockStore,
      updateBillType: vi.fn(),
      resetToDefaults: vi.fn(),
    });

    mockUseAccount.mockReturnValue({
      address: '0x123',
      status: 'disconnected',
      account: null,
    });

    mockStore._getAllFiles.mockResolvedValue({
      'file1': { 
        name: 'file1', 
        created: '2023-01-01', 
        modified: '2023-01-01', 
        billType: 1,
        isEncrypted: false 
      },
      'file2': { 
        name: 'file2', 
        created: '2023-01-02', 
        modified: '2023-01-02', 
        billType: 2,
        isEncrypted: false 
      },
    });
  });

  it('renders file list correctly', async () => {
    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('file1')).toBeInTheDocument();
      expect(screen.getByText('file2')).toBeInTheDocument();
    });
  });

  it('filters files by search query', async () => {
    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('file1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search files/i);
    fireEvent.ionInput(searchInput, { detail: { value: 'file1' } });

    await waitFor(() => {
      expect(screen.getByText('file1')).toBeInTheDocument();
      expect(screen.queryByText('file2')).not.toBeInTheDocument();
    });
  });

  it('handles file selection', async () => {
    const mockUpdateSelectedFile = vi.fn();
    mockUseInvoice.mockReturnValue({
      selectedFile: 'test-file',
      updateSelectedFile: mockUpdateSelectedFile,
      billType: 1,
      store: mockStore,
      updateBillType: vi.fn(),
      resetToDefaults: vi.fn(),
    });

    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('file1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('file1'));

    expect(mockUpdateSelectedFile).toHaveBeenCalledWith('file1');
  });

  it('shows delete confirmation dialog', async () => {
    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('file1')).toBeInTheDocument();
    });

    // Simulate swipe to reveal delete option
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete File')).toBeInTheDocument();
    });
  });

  it('handles file deletion', async () => {
    mockStore._deleteFile.mockResolvedValue(true);
    
    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('file1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
    });

    expect(mockStore._deleteFile).toHaveBeenCalledWith('file1');
  });

  it('switches between file sources', async () => {
    render(<Files {...mockProps} />);

    const serverTab = screen.getByText('Server');
    fireEvent.click(serverTab);

    await waitFor(() => {
      expect(screen.getByText('Connect to sync files')).toBeInTheDocument();
    });
  });

  it('handles encrypted files', async () => {
    mockStore._getAllFiles.mockResolvedValue({
      'encrypted-file': { 
        name: 'encrypted-file', 
        created: '2023-01-01', 
        modified: '2023-01-01', 
        billType: 1,
        isEncrypted: true 
      },
    });

    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('encrypted-file')).toBeInTheDocument();
      expect(screen.getByTestId('key-icon')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(<Files {...mockProps} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    mockStore._getAllFiles.mockRejectedValue(new Error('Network error'));

    render(<Files {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error loading files')).toBeInTheDocument();
    });
  });
});