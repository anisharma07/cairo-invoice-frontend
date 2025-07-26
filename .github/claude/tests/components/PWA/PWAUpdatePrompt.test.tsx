import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PWAUpdatePrompt from '../../../src/components/PWAUpdatePrompt';
import { usePWA } from '../../../src/hooks/usePWA';

// Mock dependencies
vi.mock('../../../src/hooks/usePWA');

const mockUsePWA = vi.mocked(usePWA);

describe('PWAUpdatePrompt Component', () => {
  const mockReloadApp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      isOnline: true,
      updateAvailable: true,
      installApp: vi.fn(),
      reloadApp: mockReloadApp,
    });
  });

  it('renders update prompt when update available', () => {
    render(<PWAUpdatePrompt />);

    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('A new version of the app is available. Restart to get the latest features.')).toBeInTheDocument();
  });

  it('does not render when no update available', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      isOnline: true,
      updateAvailable: false,
      installApp: vi.fn(),
      reloadApp: mockReloadApp,
    });

    const { container } = render(<PWAUpdatePrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('handles update now button click', () => {
    render(<PWAUpdatePrompt />);

    fireEvent.click(screen.getByText('Update Now'));

    expect(mockReloadApp).toHaveBeenCalled();
  });

  it('handles dismiss button click', () => {
    render(<PWAUpdatePrompt />);

    const dismissButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(dismissButton);

    // Should hide the prompt
    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
  });

  it('shows correct styling for fixed position', () => {
    render(<PWAUpdatePrompt />);

    const card = screen.getByText('Update Available').closest('ion-card');
    expect(card).toHaveStyle({
      position: 'fixed',
      bottom: '20px',
      zIndex: '1000',
    });
  });

  it('re-shows prompt when updateAvailable changes', () => {
    const { rerender } = render(<PWAUpdatePrompt />);

    expect(screen.getByText('Update Available')).toBeInTheDocument();

    // Dismiss the prompt
    const dismissButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();

    // Update available changes
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      isOnline: true,
      updateAvailable: true,
      installApp: vi.fn(),
      reloadApp: mockReloadApp,
    });

    rerender(<PWAUpdatePrompt />);

    expect(screen.getByText('Update Available')).toBeInTheDocument();
  });
});