import config from './config.json';

// ── Hub chain (Hedera mainnet) ──
export const HUB_CHAIN_ID = config.chain.id;

// ── Chain metadata for wallet_addEthereumChain ──
export const CHAIN_CONFIG: Record<
  number,
  {
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
> = {
  295: {
    chainName: 'Hedera Mainnet',
    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
    rpcUrls: ['https://mainnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/mainnet'],
  },
};

// ── RPC URLs ──
export const CHAIN_RPC_URLS: Record<number, string> = {
  295: CHAIN_CONFIG[295].rpcUrls[0],
};

// ── Block explorer base URLs (for tx links, append /<txHash>) ──
export const CHAIN_EXPLORER: Record<number, string> = {
  295: 'https://hashscan.io/mainnet/transaction',
};

// ── Block explorer base URLs (for address links, append /<address>) ──
export const CHAIN_ADDRESS_EXPLORER: Record<number, string> = {
  295: 'https://hashscan.io/mainnet/account',
};
