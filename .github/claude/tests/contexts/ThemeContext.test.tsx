import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '../../../src/contexts/ThemeContext';
import { Preferences } from '@capacitor/preferences';

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

const mockPreferences = vi.mocked(Preferences);

// Test component to use the theme context
const TestComponent: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div>
      <span data-testid="theme-status">
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </span>
      <button onClick={toggleDarkMode}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document class
    document.documentElement.className = '';
  });

  it('provides default light theme', async () => {
    mockPreferences.get.mockResolvedValue({ value: null });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });

  it('loads saved dark theme preference', async () => {
    mockPreferences.get.mockResolvedValue({ value: 'true' });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for async load
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('toggles theme correctly', async () => {
    mockPreferences.get.mockResolvedValue({ value: null });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('Light Mode')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Toggle Theme'));

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(mockPreferences.set).toHaveBeenCalledWith({
      key: 'darkMode',
      value: 'true',
    });
  });

  it('applies dark class to document', async () => {
    mockPreferences.get.mockResolvedValue({ value: null });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Toggle Theme'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when switching to light', async () => {
    mockPreferences.get.mockResolvedValue({ value: 'true' });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for async load
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByText('Toggle Theme'));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(mockPreferences.set).toHaveBeenCalledWith({
      key: 'darkMode',
      value: 'false',
    });
  });

  it('handles preference loading errors gracefully', async () => {
    mockPreferences.get.mockRejectedValue(new Error('Storage error'));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should default to light mode
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });

  it('handles preference saving errors gracefully', async () => {
    mockPreferences.get.mockResolvedValue({ value: null });
    mockPreferences.set.mockRejectedValue(new Error('Storage error'));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Toggle Theme'));

    // Should still toggle theme even if saving fails
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});