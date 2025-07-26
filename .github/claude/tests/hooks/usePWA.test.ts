import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePWA } from '../../../src/hooks/usePWA';

// Mock window events
const mockEventListeners: Record<string, EventListener[]> = {};

Object.defineProperty(window, 'addEventListener', {
  value: vi.fn((event: string, callback: EventListener) => {
    if (!mockEventListeners[event]) {
      mockEventListeners[event] = [];
    }
    mockEventListeners[event].push(callback);
  }),
});

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn((event: string, callback: EventListener) => {
    if (mockEventListeners[event]) {
      const index = mockEventListeners[event].indexOf(callback);
      if (index > -1) {
        mockEventListeners[event].splice(index, 1);
      }
    }
  }),
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    addEventListener: vi.fn(),
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn((query: string) => ({
    matches: query === '(display-mode: standalone)' ? false : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

describe('usePWA Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockEventListeners).forEach(key => {
      mockEventListeners[key] = [];
    });
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.updateAvailable).toBe(false);
  });

  it('detects online/offline status', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      const offlineEvent = new Event('offline');
      mockEventListeners['offline']?.forEach(callback => {
        callback(offlineEvent);
      });
    });

    expect(result.current.isOnline).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      
      const onlineEvent = new Event('online');
      mockEventListeners['online']?.forEach(callback => {
        callback(onlineEvent);
      });
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('detects install prompt', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);

    // Simulate beforeinstallprompt event
    act(() => {
      const mockPrompt = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      const installEvent = new Event('beforeinstallprompt') as any;
      Object.assign(installEvent, mockPrompt);

      mockEventListeners['beforeinstallprompt']?.forEach(callback => {
        callback(installEvent);
      });
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it('detects app installation', () => {
    const { result } = renderHook(() => usePWA());

    // First trigger install prompt
    act(() => {
      const mockPrompt = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      const installEvent = new Event('beforeinstallprompt') as any;
      Object.assign(installEvent, mockPrompt);

      mockEventListeners['beforeinstallprompt']?.forEach(callback => {
        callback(installEvent);
      });
    });

    expect(result.current.isInstallable).toBe(true);
    expect(result.current.isInstalled).toBe(false);

    // Simulate app installation
    act(() => {
      const appInstalledEvent = new Event('appinstalled');
      mockEventListeners['appinstalled']?.forEach(callback => {
        callback(appInstalledEvent);
      });
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('detects standalone mode', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn((query: string) => ({
        matches: query === '(display-mode: standalone)' ? true : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstalled).toBe(true);
  });

  it('handles install app success', async () => {
    const { result } = renderHook(() => usePWA());

    // Set up install prompt
    const mockPrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      const installEvent = new Event('beforeinstallprompt') as any;
      Object.assign(installEvent, mockPrompt);

      mockEventListeners['beforeinstallprompt']?.forEach(callback => {
        callback(installEvent);
      });
    });

    // Test install app
    let installResult: boolean;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(installResult!).toBe(true);
    expect(mockPrompt.prompt).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(false);
  });

  it('handles install app rejection', async () => {
    const { result } = renderHook(() => usePWA());

    // Set up install prompt
    const mockPrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };

    act(() => {
      const installEvent = new Event('beforeinstallprompt') as any;
      Object.assign(installEvent, mockPrompt);

      mockEventListeners['beforeinstallprompt']?.forEach(callback => {
        callback(installEvent);
      });
    });

    // Test install app
    let installResult: boolean;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(installResult!).toBe(false);
    expect(mockPrompt.prompt).toHaveBeenCalled();
  });

  it('handles install app when not available', async () => {
    const { result } = renderHook(() => usePWA());

    // Test install app without prompt
    let installResult: boolean;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(installResult!).toBe(false);
  });

  it('handles install app error', async () => {
    const { result } = renderHook(() => usePWA());

    // Set up install prompt that throws error
    const mockPrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockRejectedValue(new Error('Install failed')),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      const installEvent = new Event('beforeinstallprompt') as any;
      Object.assign(installEvent, mockPrompt);

      mockEventListeners['beforeinstallprompt']?.forEach(callback => {
        callback(installEvent);
      });
    });

    // Test install app
    let installResult: boolean;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(installResult!).toBe(false);
  });

  it('handles service worker updates', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.updateAvailable).toBe(false);

    // Mock service worker controller change
    act(() => {
      const controllerChangeEvent = new Event('controllerchange');
      (navigator.serviceWorker.addEventListener as any).mock.calls
        .find(([event]: [string]) => event === 'controllerchange')?.[1]?.(controllerChangeEvent);
    });

    expect(result.current.updateAvailable).toBe(true);
  });

  it('reloads app', () => {
    const { result } = renderHook(() => usePWA());

    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
    });

    act(() => {
      result.current.reloadApp();
    });

    expect(mockReload).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => usePWA());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});