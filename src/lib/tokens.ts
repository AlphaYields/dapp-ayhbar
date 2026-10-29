// ── Token display metadata (single source of truth) ──

export const TOKEN_ICONS: Record<string, string> = {
  HBAR: '/hedera-icon.svg',
  HBARX: '/hedera-icon.svg',
};

export const TOKEN_NETWORK_ICONS: Record<string, string> = {
  HBAR: '/hedera-icon.svg',
  HBARX: '/hedera-icon.svg',
};

export const TOKEN_NETWORK_NAMES: Record<string, string> = {
  HBAR: 'Hedera',
  HBARX: 'Hedera',
};

export const TOKEN_COLORS: Record<string, string> = {
  HBAR: '#8259EF',
  HBARX: '#8259EF',
};

/** DefiLlama coin keys (`coingecko:<id>` or `<chain>:<address>`) for /api/prices. */
export const TOKEN_PRICE_ID: Record<string, string> = {
  HBAR: 'coingecko:hedera-hashgraph',
  HBARX: 'coingecko:hbarx',
};

export const TOKEN_DISPLAY_NAME: Record<string, string> = {};

// Fallback depositable tokens per vault
export const FALLBACK_DEPOSIT_TOKENS: Record<
  string,
  Array<{
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
  }>
> = {
  // Zero address = native HBAR (see lib/hbar/vault.ts).
  ayhbar: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'HBAR', name: 'HBAR', decimals: 18 },
    { address: '0x00000000000000000000000000000000000cbA44', symbol: 'HBARX', name: 'Stader HBARX', decimals: 8 },
  ],
};
