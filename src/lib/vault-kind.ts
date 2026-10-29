import { TokenId } from '@/types/static';
import { hedera } from 'viem/chains';

/**
 * Which money-path a vault uses. This app serves one vault: ayHBAR on Hedera
 * (HBAR or HBARX in, request → redeem out), handled by the `Hbar*Modal`
 * components + `lib/hbar`.
 */
export type VaultKind = 'hbar';

export const VAULT_KIND: Record<TokenId, VaultKind> = {
  [TokenId.AYHBAR]: 'hbar',
};

export const VAULT_CHAIN_ID: Record<TokenId, number> = {
  [TokenId.AYHBAR]: hedera.id,
};

export const VAULT_CHAIN_NAME: Record<TokenId, string> = {
  [TokenId.AYHBAR]: 'Hedera',
};

export const isHbarVault = (id: TokenId) => VAULT_KIND[id] === 'hbar';
