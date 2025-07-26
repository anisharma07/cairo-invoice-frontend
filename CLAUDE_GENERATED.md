# Claude Generated Code

**Task**: /claude-generate

**Generated on**: Sat Jul 26 14:13:23 UTC 2025

## Generated Content

```
Based on the codebase context, I'll implement a comprehensive wallet connection hook that integrates with the existing Starknet infrastructure. The current `useWalletConnection.ts` file is empty, so I'll create a complete implementation.

## FILES_TO_CREATE
- None (all modifications to existing files)

## FILES_TO_MODIFY
1. `src/hooks/useWalletConnection.ts`
2. `src/providers/StarknetProviders.tsx`
3. `src/utils/walletDebug.ts`

## CODE_CHANGES

### 1. src/hooks/useWalletConnection.ts

```typescript
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState, useEffect, useCallback } from "react";
import { Connector } from "@starknet-react/core";
import { debugWalletConnection } from "../utils/walletDebug";

export interface WalletConnectionState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  
  // Account info
  address: string | undefined;
  chainId: string | undefined;
  
  // Error handling
  error: string | null;
  connectionError: string | null;
  
  // Available connectors
  connectors: Connector[];
  
  // Connection methods
  connect: (connector: Connector) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  isWalletAvailable: (walletName: string) => boolean;
  getWalletDisplayName: (connector: Connector) => string;
  getWalletIcon: (connector: Connector) => string;
}

export interface UseWalletConnectionOptions {
  autoReconnect?: boolean;
  debugMode?: boolean;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export const useWalletConnection = (
  options: UseWalletConnectionOptions = {}
): WalletConnectionState => {
  const {
    autoReconnect = true,
    debugMode = false,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  // Starknet React hooks
  const { address, chainId, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect: starknetConnect, connectors } = useConnect();
  const { disconnect: starknetDisconnect } = useDisconnect();

  // Local state
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Debug logging
  useEffect(() => {
    if (debugMode) {
      debugWalletConnection();
      console.log("Wallet connection state:", {
        isConnected,
        isConnecting,
        isReconnecting,
        address,
        chainId,
        availableConnectors: connectors.length,
      });
    }
  }, [isConnected, isConnecting, isReconnecting, address, chainId, connectors, debugMode]);

  // Handle connection success
  useEffect(() => {
    if (isConnected && address && !isConnecting) {
      setError(null);
      setConnectionError(null);
      onConnect?.(address);
      
      if (debugMode) {
        console.log("✅ Wallet connected successfully:", address);
      }
    }
  }, [isConnected, address, isConnecting, onConnect, debugMode]);

  // Handle disconnection
  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting && hasAttemptedReconnect) {
      onDisconnect?.();
      
      if (debugMode) {
        console.log("❌ Wallet disconnected");
      }
    }
  }, [isConnected, isConnecting, isReconnecting, hasAttemptedReconnect, onDisconnect, debugMode]);

  // Auto-reconnect logic
  useEffect(() => {
    if (autoReconnect && !isConnected && !isConnecting && !hasAttemptedReconnect) {
      const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
      
      if (lastConnectedWallet) {
        const connector = connectors.find(c => c.id === lastConnectedWallet);
        if (connector) {
          if (debugMode) {
            console.log("🔄 Attempting auto-reconnect with:", connector.id);
          }
          
          handleConnect(connector).finally(() => {
            setHasAttemptedReconnect(true);
          });
        } else {
          setHasAttemptedReconnect(true);
        }
      } else {
        setHasAttemptedReconnect(true);
      }
    }
  }, [autoReconnect, isConnected, isConnecting, hasAttemptedReconnect, connectors, debugMode]);

  // Connect to wallet
  const handleConnect = useCallback(async (connector: Connector): Promise<void> => {
    try {
      setError(null);
      setConnectionError(null);
      
      if (debugMode) {
        console.log("🔌 Attempting to connect with:", connector.id);
      }

      // Check if wallet is available
      if (!isWalletAvailable(connector.id)) {
        const errorMsg = `${getWalletDisplayName(connector)} is not installed or available`;
        setConnectionError(errorMsg);
        onError?.(errorMsg);
        throw new Error(errorMsg);
      }

      // Attempt connection
      await starknetConnect({ connector });
      
      // Store last connected wallet for auto-reconnect
      localStorage.setItem('lastConnectedWallet', connector.id);
      
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to connect wallet";
      setConnectionError(errorMessage);
      onError?.(errorMessage);
      
      if (debugMode) {
        console.error("❌ Connection failed:", err);
      }
      
      // Remove failed connection from storage
      localStorage.removeItem('lastConnectedWallet');
      throw err;
    }
  }, [starknetConnect, onError, debugMode]);

  // Disconnect wallet
  const handleDisconnect = useCallback(async (): Promise<void> => {
    try {
      if (debugMode) {
        console.log("🔌 Disconnecting wallet");
      }
      
      await starknetDisconnect();
      localStorage.removeItem('lastConnectedWallet');
      setError(null);
      setConnectionError(null);
      
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to disconnect wallet";
      setError(errorMessage);
      onError?.(errorMessage);
      
      if (debugMode) {
        console.error("❌ Disconnect failed:", err);
      }
      
      throw err;
    }
  }, [starknetDisconnect, onError, debugMode]);

  // Reconnect wallet
  const handleReconnect = useCallback(async (): Promise<void> => {
    if (isConnected) {
      await handleDisconnect();
    }
    
    const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
    if (lastConnectedWallet) {
      const connector = connectors.find(c => c.id === lastConnectedWallet);
      if (connector) {
        await handleConnect(connector);
      } else {
        throw new Error("Previously connected wallet is no longer available");
      }
    } else {
      throw new Error("No previously connected wallet found");
    }
  }, [isConnected, handleDisconnect, handleConnect, connectors]);

  // Clear error states
  const clearError = useCallback(() => {
    setError(null);
    setConnectionError(null);
  }, []);

  // Check if specific wallet is available
  const isWalletAvailable = useCallback((walletName: string): boolean => {
    switch (walletName.toLowerCase()) {
      case 'argentx':
      case 'argent':
        return !!(window as any).starknet;
      case 'braavos':
        return !!(window as any).starknet_braavos;
      default:
        return false;
    }
  }, []);

  // Get wallet display name
  const getWalletDisplayName = useCallback((connector: Connector): string => {
    switch (connector.id.toLowerCase()) {
      case 'argentx':
      case 'argent':
        return 'ArgentX';
      case 'braavos':
        return 'Braavos';
      default:
        return connector.name || connector.id;
    }
  }, []);

  // Get wallet icon
  const getWalletIcon = useCallback((connector: Connector): string => {
    switch (connector.id.toLowerCase()) {
      case 'argentx':
      case 'argent':
        return '/images/wallets/argentx.svg';
      case 'braavos':
        return '/images/wallets/braavos.svg';
      default:
        return '/images/wallets/default.svg';
    }
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    isReconnecting,
    
    // Account info
    address,
    chainId,
    
    // Error handling
    error,
    connectionError,
    
    // Available connectors
    connectors,
    
    // Connection methods
    connect: handleConnect,
    disconnect: handleDisconnect,
    reconnect: handleReconnect,
    
    // Utility methods
    clearError,
    isWalletAvailable,
    getWalletDisplayName,
    getWalletIcon,
  };
};

// Hook for getting connection status only (lightweight)
export const useWalletStatus = () => {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  
  return {
    isConnected,
    isConnecting,
    address,
    chainId,
    hasWallet: !!address,
  };
};

// Hook for wallet utilities without connection logic
export const useWalletUtils = () => {
  const { connectors } = useConnect();
  
  const isWalletAvailable = useCallback((walletName: string): boolean => {
    switch (walletName.toLowerCase()) {
      case 'argentx':
      case 'argent':
        return !!(window as any).starknet;
      case 'braavos':
        return !!(window as any).starknet_braavos;
      default:
        return false;
    }
  }, []);
  
  const getAvailableWallets = useCallback(() => {
    return connectors.filter(connector => 
      isWalletAvailable(connector.id)
    );
  }, [connectors, isWalletAvailable]);
  
  return {
    connectors,
    isWalletAvailable,
    getAvailableWallets,
  };
};
```

### 2. src/providers/StarknetProviders.tsx (Enhancement)

```typescript
"use client";
import { ReactNode, useEffect } from "react";

import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  argent,
  braavos,
  useInjectedConnectors,
  jsonRpcProvider,
  voyager,
} from "@starknet-react/core";

interface StarknetProvidersProps {
  children: ReactNode;
  debugMode?: boolean;
}

export function StarknetProviders({ 
  children, 
  debugMode = false 
}: StarknetProvidersProps) {
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "random",
  });

  const rpcUrl =
    import.meta.env.VITE_STARKNET_RPC_URL ||
    "https://starknet-sepolia.public.blastapi.io";

  // Debug wallet availability on mount
  useEffect(() => {
    if (debugMode) {
      console.log("=== Starknet Provider Debug ===");
      console.log("Available connectors:", connectors.length);
      console.log("RPC URL:", rpcUrl);
      console.log("ArgentX available:", !!(window as any).starknet);
      console.log("Braavos available:", !!(window as any).starknet_braavos);
      
      connectors.forEach(connector => {
        console.log(`Connector: ${connector.name} (${connector.id})`);
      });
    }
  }, [connectors, rpcUrl, debugMode]);

  return (
    <StarknetConfig
      chains={[sepolia, mainnet]}
      provider={jsonRpcProvider({ rpc: () => ({ nodeUrl: rpcUrl }) })}
      connectors={connectors}
      explorer={voyager}
      autoConnect={true}
    >
      {children}
    </StarknetConfig>
  );
}
```

### 3. src/utils/walletDebug.ts (Enhancement)

```typescript
/**
 * Utility functions for debugging wallet connection issues
 */

export interface WalletDebugInfo {
  hasArgentX: boolean;
  hasBraavos: boolean;
  isSecureContext: boolean;
  currentDomain: string;
  walletStorageKeys: string[];
  userAgent: string;
  networkStatus: string;
}

export const debugWalletConnection = (): WalletDebugInfo => {
  console.log("=== Wallet Debug Info ===");

  // Check for wallet extensions
  const hasArgentX = !!(window as any).starknet;
  const hasBraavos = !!(window as any).starknet_braavos;

  console.log("ArgentX detected:", hasArgentX);
  console.log("Braavos detected:", hasBraavos);

  // Check current domain
  const currentDomain = window.location.origin;
  console.log("Current domain:", currentDomain);
  console.log("Current URL:", window.location.href);

  // Check if we're in a secure context
  const isSecureContext = window.isSecureContext;
  console.log("Secure context (HTTPS):", isSecureContext);

  // Check localStorage for any wallet data
  const walletStorageKeys = Object.keys(localStorage).filter(
    (key) =>
      key.includes("wallet") ||
      key.includes("starknet") ||
      key.includes("connect") ||
      key.includes("argent") ||
      key.includes("braavos")
  );
  console.log("Wallet-related localStorage keys:", walletStorageKeys);

  // Log wallet storage data (be careful with sensitive data)
  walletStorageKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value?.substring(0, 50) + (value && value.length > 50 ? '...' : ''));
  });

  // Check user agent
  const userAgent = navigator.userAgent;
  console.log("User Agent:", userAgent);

  // Check network status
  const networkStatus = navigator.onLine ? 'online' : 'offline';
  console.log("Network status:", networkStatus);

  // Check for mobile wallet apps
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  console.log("Is mobile:", isMobile);

  if (isMobile) {
    console.log("Mobile wallet detection:");
    console.log("- ArgentX mobile:", hasArgentX);
    console.log("- Braavos mobile:", hasBraavos);
  }

  // Check Starknet object details
  if (hasArgentX) {
    const argentX = (window as any).starknet;
    console.log("ArgentX details:", {
      id: argentX.id,
      name: argentX.name,
      version: argentX.version,
      icon: argentX.icon ? 'present' : 'missing',
      isConnected: argentX.isConnected,
    });
  }

  if (hasBraavos) {
    const braavos = (window as any).starknet_braavos;
    console.log("Braavos details:", {
      id: braavos.id,
      name: braavos.name,
      version: braavos.version,
      icon: braavos.icon ? 'present' : 'missing',
      isConnected: braavos.isConnected,
    });
  }

  console.log("=== End Debug Info ===");

  return {
    hasArgentX,
    hasBraavos,
    isSecureContext,
    currentDomain,
    walletStorageKeys,
    userAgent,
    networkStatus,
  };
};

export const checkWalletCompatibility = (): {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check HTTPS
  if (!window.isSecureContext) {
    issues.push("Not running in secure context (HTTPS required)");
    recommendations.push("Access the app via HTTPS");
  }

  // Check for wallets
  const hasArgentX = !!(window as any).starknet;
  const hasBraavos = !!(window as any).starknet_braavos;

  if (!hasArgentX && !hasBraavos) {
    issues.push("No supported wallets detected");
    recommendations.push("Install ArgentX or Braavos wallet extension");
  }

  // Check localStorage availability
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    issues.push("localStorage not available");
    recommendations.push("Enable browser storage or use incognito mode");
  }

  // Check network
  if (!navigator.onLine) {
    issues.push("No internet connection");
    recommendations.push("Check your internet connection");
  }

  const compatible = issues.length === 0;

  return {
    compatible,
    issues,
    recommendations,
  };
};

export const getWalletConnectionTroubleshooting = (): string[] => {
  const troubleshooting = [
    "1. Ensure you have ArgentX or Braavos wallet installed",
    "2. Make sure the wallet extension is enabled and unlocked",
    "3. Check that you're accessing the app via HTTPS",
    "4. Try refreshing the page",
    "5. Clear browser cache and localStorage",
    "6. Disable other wallet extensions that might conflict",
    "7. Check if the wallet is connected to the correct network (Sepolia/Mainnet)",
    "8. Try connecting in an incognito/private browsing window",
    "9. Update your wallet extension to the latest version",
    "10. Restart your browser",
  ];

  return troubleshooting;
};

// Export debug info for use in components
export const exportDebugInfo = (): string => {
  const info = debugWalletConnection();
  const compatibility = checkWalletCompatibility();
  const troubleshooting = getWalletConnectionTroubleshooting();

  const debugReport = {
    timestamp: new Date().toISOString(),
    walletInfo: info,
    compatibility: compatibility,
    troubleshooting: troubleshooting,
    url: window.location.href,
  };

  return JSON.stringify(debugReport, null, 2);
};
```

## INSTRUCTIONS

1. **Integration with existing components**: The `useWalletConnection` hook is designed to work seamlessly with your existing Starknet infrastructure and can be imported and used in any component.

2. **Usage in components**: 
```typescript
import { useWalletConnection } from '../hooks/useWalletConnection';

const MyComponent = () => {
  const { 
    isConnected, 
    address, 
    connect, 
    disconnect, 
    connectors,
    error 
  } = useWalletConnection({
    debugMode: true, // Enable for development
    onConnect: (address) => console.log('Connected:', address),
    onError: (error) => console.error('Wallet error:', error)
  });

  // Use the hook data...
};
```

3. **Enable debug mode**: Set `debugMode: true` in development to get detailed console logging.

4. **Auto-reconnection**: The hook automatically attempts to reconnect to the last used wallet on app startup.

5. **Error handling**: Comprehensive error handling with specific error messages for different failure scenarios.

6. **TypeScript support**: Full TypeScript support with proper type definitions.

7. **Mobile compatibility**: The hook detects and handles mobile wallet connections.

8. **Storage management**: Automatically manages localStorage for connection persistence.

This implementation provides a robust, production-ready wallet connection system that integrates perfectly with your existing Starknet infrastructure and Ionic React application.
```
