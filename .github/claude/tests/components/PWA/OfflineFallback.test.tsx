import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import OfflineFallback from '../../../src/components/OfflineFallback';

describe('OfflineFallback Component', () => {
  it('renders offline message', () => {
    render(<OfflineFallback />);

    expect(screen.getByText("You're Offline")).toBeInTheDocument();
    expect(screen.getByText("This content isn't available offline. Please check your internet connection and try again.")).toBeInTheDocument();
  });

  it('shows retry button when onRetry provided', () => {
    const mockOnRetry = vi.fn();
    render(<OfflineFallback onRetry={mockOnRetry} />);

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('shows home button when onHome provided', () => {
    const mockOnHome = vi.fn();
    render(<OfflineFallback onHome={mockOnHome} />);

    const homeButton = screen.getByText('Go Home');
    expect(homeButton).toBeInTheDocument();

    fireEvent.click(homeButton);
    expect(mockOnHome).toHaveBeenCalled();
  });

  it('shows both buttons when both handlers provided', () => {
    const mockOnRetry = vi.fn();
    const mockOnHome = vi.fn();
    
    render(<OfflineFallback onRetry={mockOnRetry} onHome={mockOnHome} />);

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('does not show buttons when no handlers provided', () => {
    render(<OfflineFallback />);

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
  });

  it('shows offline icon', () => {
    render(<OfflineFallback />);

    const offlineIcon = screen.getByTestId('offline-icon');
    expect(offlineIcon).toBeInTheDocument();
  });

  it('shows installation tip', () => {
    render(<OfflineFallback />);

    expect(screen.getByText('Install this app to your home screen for better offline access!')).toBeInTheDocument();
  });

  it('has correct styling structure', () => {
    render(<OfflineFallback />);

    const content = screen.getByText("You're Offline").closest('ion-content');
    expect(content).toHaveClass('ion-padding');
  });
});