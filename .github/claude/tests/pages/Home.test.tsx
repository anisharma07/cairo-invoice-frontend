import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Home from '../../../src/pages/Home';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useInvoice } from '../../../src/contexts/InvoiceContext';
import { usePWA } from '../../../src/hooks/usePWA';

// Mock dependencies
vi.mock('../../../src/contexts/ThemeContext');
vi.mock('../../../src/contexts/InvoiceContext');
vi.mock('../../../src/hooks/usePWA');
vi.mock('../../../src/components/socialcalc/index.js', () => ({
  getDeviceType: vi.fn(() => 'default'),
  initializeApp: vi.fn(),
}));

const mockUseTheme = vi.mocked(useTheme);
const mockUseInvoice = vi.mocked(useInvoice);
const mockUsePWA = vi.mocked(usePWA);

describe('Home Page', () => {
  const mockStore = {
    _getFile: vi.fn(),
    _saveFile: vi.fn(),
    _checkKey: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseTheme.mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: vi.fn(),
    });

    mockUseInvoice.mockReturnValue({
      selectedFile: 'default',
      billType: 1,
      store: mockStore,
      updateSelectedFile: vi.fn(),
      updateBillType: vi.fn(),
      resetToDefaults: vi.fn(),
    });

    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      updateAvailable: false,
      installApp: vi.fn(),
      reloadApp: vi.fn(),
    });
  });

  it('renders home page elements', () => {
    render(<Home />);

    expect(screen.getByText('Invoice Suite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /actions/i })).toBeInTheDocument();
  });

  it('handles save action', async () => {
    mockStore._getFile.mockResolvedValue({
      name: 'default',
      content: 'test content',
      created: '2023-01-01',
      modified: '2023-01-01',
      billType: 1,
    });

    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockStore._saveFile).toHaveBeenCalled();
    });
  });

  it('shows save as dialog', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    fireEvent.click(screen.getByText('Save As'));

    expect(screen.getByText('Save As')).toBeInTheDocument();
  });

  it('handles file synchronization', async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /sync/i }));

    await waitFor(() => {
      expect(screen.getByText('Synchronizing...')).toBeInTheDocument();
    });
  });

  it('shows color picker modal', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /color/i }));

    expect(screen.getByText('Sheet Colors')).toBeInTheDocument();
  });

  it('changes background color', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /color/i }));

    const redColor = screen.getByText('Red');
    fireEvent.click(redColor);

    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('handles PWA installation', () => {
    render(<Home />);

    expect(screen.getByText('Install App')).toBeInTheDocument();
  });

  it('shows online status', () => {
    render(<Home />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('handles offline mode', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: false,
      updateAvailable: false,
      installApp: vi.fn(),
      reloadApp: vi.fn(),
    });

    render(<Home />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('validates save as filename', async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    fireEvent.click(screen.getByText('Save As'));

    const input = screen.getByPlaceholderText('Enter filename');
    fireEvent.ionInput(input, { detail: { value: 'invalid/name' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Special Characters cannot be used')).toBeInTheDocument();
    });
  });

  it('handles menu actions', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('shows wallet connection status', () => {
    render(<Home />);

    expect(screen.getByTestId('wallet-connection')).toBeInTheDocument();
  });

  it('handles quota exceeded errors', async () => {
    mockStore._saveFile.mockRejectedValue(new Error('QuotaExceededError'));

    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Storage quota exceeded')).toBeInTheDocument();
    });
  });
});