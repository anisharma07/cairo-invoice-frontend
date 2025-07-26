import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PWAInstallPrompt from '../../../src/components/PWAInstallPrompt';
import { usePWA } from '../../../src/hooks/usePWA';

// Mock dependencies
vi.mock('../../../src/hooks/usePWA');

const mockUsePWA = vi.mocked(usePWA);

describe('PWAInstallPrompt Component', () => {
  const mockInstallApp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      updateAvailable: false,
      installApp: mockInstallApp,
      reloadApp: vi.fn(),
    });
  });

  it('renders install prompt when installable', () => {
    render(<PWAInstallPrompt />);

    expect(screen.getByText('Install App')).toBeInTheDocument();
    expect(screen.getByText('Add to home screen for quick access')).toBeInTheDocument();
  });

  it('does not render when not installable', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      updateAvailable: false,
      installApp: mockInstallApp,
      reloadApp: vi.fn(),
    });

    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('shows install dialog when clicked', async () => {
    render(<PWAInstallPrompt />);

    fireEvent.click(screen.getByText('Install App'));

    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument();
      expect(screen.getByText('Would you like to install this app to your home screen for easy access?')).toBeInTheDocument();
    });
  });

  it('handles install confirmation', async () => {
    mockInstallApp.mockResolvedValue(true);

    render(<PWAInstallPrompt />);

    fireEvent.click(screen.getByText('Install App'));

    await waitFor(() => {
      const installButton = screen.getByText('Install');
      fireEvent.click(installButton);
    });

    expect(mockInstallApp).toHaveBeenCalled();
  });

  it('shows success toast after installation', async () => {
    mockInstallApp.mockResolvedValue(true);

    render(<PWAInstallPrompt />);

    fireEvent.click(screen.getByText('Install App'));

    await waitFor(() => {
      const installButton = screen.getByText('Install');
      fireEvent.click(installButton);
    });

    await waitFor(() => {
      expect(screen.getByText('App installed successfully!')).toBeInTheDocument();
    });
  });

  it('handles installation failure', async () => {
    mockInstallApp.mockResolvedValue(false);

    render(<PWAInstallPrompt />);

    fireEvent.click(screen.getByText('Install App'));

    await waitFor(() => {
      const installButton = screen.getByText('Install');
      fireEvent.click(installButton);
    });

    expect(mockInstallApp).toHaveBeenCalled();
    // Should not show success toast
    expect(screen.queryByText('App installed successfully!')).not.toBeInTheDocument();
  });

  it('handles cancel action', async () => {
    render(<PWAInstallPrompt />);

    fireEvent.click(screen.getByText('Install App'));

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    expect(mockInstallApp).not.toHaveBeenCalled();
  });
});