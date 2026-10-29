import { AYHBAR_VAULT_ADDRESS } from './contracts'

// Re-export from canonical sources for backward compatibility
export {
  HUB_CHAIN_ID,
  CHAIN_CONFIG,
  CHAIN_RPC_URLS,
  CHAIN_EXPLORER,
} from './constants'

export {
  TOKEN_ICONS,
  TOKEN_NETWORK_ICONS,
  TOKEN_NETWORK_NAMES,
  TOKEN_COLORS,
  TOKEN_DISPLAY_NAME,
} from './tokens'

// ── Vault decimals (for share formatting) ──
export const VAULT_DECIMALS: Record<string, number> = {
  // ayHBAR: decimals() = 14 on-chain (HBARX 8 + 6-decimal virtual offset).
  [AYHBAR_VAULT_ADDRESS.toLowerCase()]: 14,
}
