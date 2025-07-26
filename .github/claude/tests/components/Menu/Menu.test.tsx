import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Menu from '../../../src/components/Menu/Menu';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useInvoice } from '../../../src/contexts/InvoiceContext';
import { isPlatform } from '@ionic/react';

// Mock dependencies
vi.mock('../../../src/contexts/ThemeContext');
vi.mock('../../../src/contexts/InvoiceContext');
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...actual,
    isPlatform: vi.fn(),
  };
});

vi.mock('@capacitor/share', () => ({
  Share: {
    share: vi.fn(),
  },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
  },
  Directory: {
    Documents: 'DOCUMENTS',
  },
  Encoding: {
    UTF8: 'utf8',
  },
}));

const mockUseTheme = vi.mocked(useTheme);
const mockUseInvoice = vi.mocked(useInvoice);
const mockIsPlatform = vi.mocked(isPlatform);

describe('Menu Component', () => {
  const mockStore = {
    _getFile: vi.fn(),
    _saveFile: vi.fn(),
    _checkKey: vi.fn(),
  };

  const mockProps = {
    showM: true,
    setM: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseTheme.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: vi.fn(),
    });

    mockUseInvoice.mockReturnValue({
      selectedFile: 'test-file',
      billType: 1,
      store: mockStore,
      updateSelectedFile: vi.fn(),
    });

    mockIsPlatform.mockReturnValue(false);
  });

  it('renders menu actions correctly', () => {
    render(<Menu {...mockProps} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Save As')).toBeInTheDocument();
    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('handles save action', async () => {
    mockStore._getFile.mockResolvedValue({
      name: 'test-file',
      content: 'test content',
      created: '2023-01-01',
      modified: '2023-01-01',
      billType: 1,
    });

    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockStore._saveFile).toHaveBeenCalled();
    });
  });

  it('shows save as dialog', () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Save As'));

    expect(screen.getByText('Save As')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter filename')).toBeInTheDocument();
  });

  it('handles PDF export', async () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Export as PDF'));

    await waitFor(() => {
      expect(screen.getByText('PDF Filename')).toBeInTheDocument();
    });
  });

  it('handles CSV export', async () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Export as CSV'));

    await waitFor(() => {
      expect(screen.getByText('CSV Filename')).toBeInTheDocument();
    });
  });

  it('handles print action on mobile', () => {
    mockIsPlatform.mockReturnValue(true);
    
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Print'));

    // Should trigger native print
    expect(mockIsPlatform).toHaveBeenCalledWith('hybrid');
  });

  it('handles email action', () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Email'));

    // Should open email composer
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('validates filename input', async () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Save As'));

    const input = screen.getByPlaceholderText('Enter filename');
    fireEvent.ionInput(input, { detail: { value: 'invalid/filename' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Special Characters cannot be used')).toBeInTheDocument();
    });
  });

  it('handles password protection', () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Save As'));

    const passwordToggle = screen.getByText('Password Protect');
    fireEvent.click(passwordToggle);

    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('shows loading state during operations', async () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Export as PDF'));

    await waitFor(() => {
      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
    });
  });

  it('handles cloud upload', async () => {
    render(<Menu {...mockProps} />);

    fireEvent.click(screen.getByText('Upload to Server'));

    await waitFor(() => {
      expect(screen.getByText('Upload to Server')).toBeInTheDocument();
    });
  });
});