/**
 * Starknet network configuration.
 *
 * Public RPC endpoints come and go (Blast API shut down in 2025, Alchemy
 * retired the v0_7/v0_8 paths), so the configured URL is normalised and we
 * always fall back to a known-good public Sepolia node.
 */
export const SEPOLIA_FALLBACK_RPC = "https://starknet-sepolia-rpc.publicnode.com";
export const MAINNET_FALLBACK_RPC = "https://starknet-rpc.publicnode.com";

export const VOYAGER_SEPOLIA = "https://sepolia.voyager.online";

export function resolveSepoliaRpc(configured?: string): string {
  const url = (configured || "").trim();
  if (!url) return SEPOLIA_FALLBACK_RPC;
  // Blast API public endpoints are discontinued.
  if (/blastapi\.io/i.test(url)) return SEPOLIA_FALLBACK_RPC;
  // Alchemy dropped the v0_7 / v0_8 JSON-RPC paths; v0_9 serves the same API.
  if (/alchemy\.com\/starknet\/version\/rpc\/v0_[78]\//i.test(url)) {
    return url.replace(/\/rpc\/v0_[78]\//i, "/rpc/v0_9/");
  }
  return url;
}

export const SEPOLIA_RPC_URL = resolveSepoliaRpc(
  import.meta.env.VITE_STARKNET_RPC_URL as string | undefined
);

export const voyagerTx = (hash: string) => `${VOYAGER_SEPOLIA}/tx/${hash}`;
export const voyagerContract = (addr: string) =>
  `${VOYAGER_SEPOLIA}/contract/${addr}`;
