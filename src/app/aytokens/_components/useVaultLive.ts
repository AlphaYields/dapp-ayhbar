'use client';

import { useVaults } from '@/hooks/use-vaults';
import { VAULT_MAP } from '@/lib/contracts';
import { TokenId } from '@/types/static';
import type { SubVault } from '@/types/data';

/**
 * Subset of vault stats the ported marketing token pages surface. Mirrors the
 * landing's `LiveVault`, but in the dapp the data comes from the live
 * `useVaults()` query (react-query, /api/vaultdata_v2) rather than a
 * seed-then-refetch fetch. APY fields arrive already scaled to percent.
 */
export type LiveVault = {
  apy?: number;
  apy_7d?: number;
  /** NET 30-day APY (AY strategies + staking). */
  apy_1m?: number;
  apy_3m?: number;
  /** Staking APY in raw KAT terms — null for every vault but ayKAT. */
  apy_kat_1m?: number | null;
  last_share_price?: number;
  max_drawdown?: number;
  pnl_since_inception?: number;
  sharpe_ratio?: number;
  nav_denomination_token?: number;
  nav_usd?: number;
  total_pnl_usd?: number;
  sub_vaults?: SubVault[] | null;
  /** `historical_data` share-price series — plotted by the share-price charts. */
  data?: { unix_time: number; share_price: number }[];
};

/** Lowercased on-chain address → TokenId, inverted from the dapp VAULT_MAP. */
const ADDRESS_TO_ID: Record<string, TokenId> = Object.fromEntries(
  Object.entries(VAULT_MAP).map(([id, addr]) => [addr.toLowerCase(), id as TokenId])
);

/**
 * Resolve live vault stats for a vault address. Components seed their display
 * from the static `TokenContent` constants; once `useVaults()` resolves, the
 * returned fields override the headline numbers. `VaultData` is a superset of
 * `LiveVault`, so it satisfies the contract directly.
 */
export function useVaultLive(address: string): LiveVault {
  const { data } = useVaults();
  const id = ADDRESS_TO_ID[address.toLowerCase()];
  return id && data ? data[id] : {};
}

/** Format a live percent number as e.g. "9.8%", or fall back to the seed. */
export function pct(value: number | undefined, seed: string): string {
  return typeof value === 'number' ? `${value.toFixed(1)}%` : seed;
}

/** USD NAV as "$0.51M". */
export const fmtUsdM = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`;
/** Native-token NAV as "17.34M WFLOW". */
export const fmtNativeM = (n: number, sym: string) => `${(n / 1_000_000).toFixed(2)}M ${sym}`;
/** Full-dollar total as "$664,724" (matches the Yield stat style). */
export const fmtUsdFull = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
