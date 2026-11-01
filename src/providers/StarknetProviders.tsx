"use client";
import { ReactNode } from "react";

import { sepolia, mainnet } from "@starknet-react/chains";
import { SEPOLIA_RPC_URL, MAINNET_FALLBACK_RPC } from "../config/starknet";
import {
  StarknetConfig,
  argent,
  braavos,
  useInjectedConnectors,
  jsonRpcProvider,
  voyager,
} from "@starknet-react/core";

export function StarknetProviders({ children }: { children: ReactNode }) {
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "random",
  });


  return (
    <StarknetConfig
      chains={[sepolia, mainnet]}
      provider={jsonRpcProvider({
        rpc: (chain) => ({
          nodeUrl:
            chain.id === mainnet.id ? MAINNET_FALLBACK_RPC : SEPOLIA_RPC_URL,
          // RPC spec 0.9+ removed the "pending" block tag that starknet.js v6
          // uses by default, so pin reads to "latest".
          blockIdentifier: "latest",
        }),
      })}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
