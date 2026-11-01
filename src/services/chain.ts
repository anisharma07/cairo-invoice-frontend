import { Contract, RpcProvider, type Abi } from "starknet";
import { MED_INVOICE_ABI } from "../abis/medInvoiceAbi";
import { MED_TOKEN_ABI } from "../abis/medToken";
import {
  MED_INVOICE_CONTRACT_ADDRESS,
  MED_TOKEN_CONTRACT_ADDRESS,
} from "../abis/constants";
import { SEPOLIA_RPC_URL, SEPOLIA_FALLBACK_RPC } from "../config/starknet";
import { toFileLimits } from "../hooks/useContractRead";

/**
 * Read-only access to the Cairo Invoice contracts on Starknet Sepolia.
 * No wallet required, so anyone can verify invoice records.
 */

const RPC_URLS = Array.from(new Set([SEPOLIA_RPC_URL, SEPOLIA_FALLBACK_RPC]));
const providers = RPC_URLS.map(
  (nodeUrl) => new RpcProvider({ nodeUrl, blockIdentifier: "latest" })
);
let preferred = 0;

/**
 * Run a read against the preferred RPC, falling back to the others on error.
 * Whichever succeeds becomes preferred for the next call.
 */
async function withProvider<T>(fn: (p: RpcProvider) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < providers.length; i++) {
    const idx = (preferred + i) % providers.length;
    try {
      const result = await fn(providers[idx]);
      preferred = idx;
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`RPC ${RPC_URLS[idx]} failed, trying next`, error);
    }
  }
  throw lastError;
}

const invoice = (p: RpcProvider) =>
  new Contract(MED_INVOICE_ABI as Abi, MED_INVOICE_CONTRACT_ADDRESS, p);
const token = (p: RpcProvider) =>
  new Contract(MED_TOKEN_ABI as Abi, MED_TOKEN_CONTRACT_ADDRESS, p);

const toHexAddress = (v: unknown) =>
  "0x" + BigInt(v as bigint).toString(16).padStart(64, "0");

const decodeShortString = (v: unknown): string => {
  if (typeof v === "string") return v;
  try {
    let hex = BigInt(v as bigint).toString(16);
    if (hex.length % 2) hex = "0" + hex;
    let out = "";
    for (let i = 0; i < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    return out;
  } catch {
    return String(v);
  }
};

export interface NetworkStatus {
  blockNumber: number;
  rpcHost: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  address: string;
}

export interface Plan {
  id: number;
  name: string;
  cost: bigint;
  filesAllowed: number;
}

export interface InvoiceRecord {
  fileName: string;
  cid: string;
  timestamp: number;
  owner: string;
}

export interface AccountSnapshot {
  address: string;
  tokenBalance: bigint;
  filesUsed: number;
  filesAllowed: number;
  records: InvoiceRecord[];
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  return withProvider(async (p) => ({
    blockNumber: await p.getBlockNumber(),
    rpcHost: new URL(p.channel.nodeUrl).host,
  }));
}

export async function getTokenInfo(): Promise<TokenInfo> {
  return withProvider(async (p) => {
    const t = token(p);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      t.name(),
      t.symbol(),
      t.decimals(),
      t.total_supply(),
    ]);
    return {
      name: decodeShortString(name),
      symbol: decodeShortString(symbol),
      decimals: Number(decimals),
      totalSupply: BigInt(totalSupply),
      address: MED_TOKEN_CONTRACT_ADDRESS,
    };
  });
}

export async function getPlans(): Promise<Plan[]> {
  return withProvider(async (p) => {
    const raw = (await invoice(p).get_all_plans()) as any[];
    return raw.map((plan) => ({
      id: Number(plan.plan_id),
      name: decodeShortString(plan.plan_name),
      cost: BigInt(plan.cost),
      filesAllowed: Number(plan.files_allowed),
    }));
  });
}

export async function getContractOwner(): Promise<string> {
  return withProvider(async (p) => toHexAddress(await invoice(p).owner()));
}

export function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{1,64}$/.test(addr.trim());
}

export async function getAccountSnapshot(
  address: string
): Promise<AccountSnapshot> {
  const addr = address.trim();
  return withProvider(async (p) => {
    const inv = invoice(p);
    const [files, limits, balance] = await Promise.all([
      inv.get_files(addr) as Promise<any[]>,
      inv.get_user_file_limits(addr),
      token(p).balance_of(addr),
    ]);
    const lim = toFileLimits(limits) || [0n, 0n];
    const records: InvoiceRecord[] = (files || [])
      .filter((f) => f.exists !== false)
      .map((f) => ({
        fileName: String(f.file_name),
        cid: String(f.ipfs_cid),
        timestamp: Number(f.timestamp),
        owner: toHexAddress(f.owner),
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
    return {
      address: toHexAddress(addr),
      tokenBalance: BigInt(balance),
      filesUsed: Number(lim[0]),
      filesAllowed: Number(lim[1]),
      records,
    };
  });
}

/** Format an 18-decimal token amount for display. */
export function formatToken(amount: bigint, decimals = 18, maxFrac = 2): string {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFrac)
    .replace(/0+$/, "");
  return (
    whole.toLocaleString("en-US") + (fracStr ? "." + fracStr : "")
  );
}

/** A CIDv0 is base58 "Qm…" (46 chars); CIDv1 usually starts with "b". */
export function looksLikeCid(cid: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^b[a-z2-7]{20,}$/.test(cid);
}
