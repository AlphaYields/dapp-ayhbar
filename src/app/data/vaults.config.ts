/**
 * Canonical on-chain config for the ayHBAR vault (Hedera, chain 295).
 * Real contract data — addresses/decimals/deposit token — kept separate from the
 * presentational `MOCK_VAULTS` copy. The landing APY readouts resolve a vault's
 * live APY from its `address` via `fetchVaultApy` (see `vaultApi.ts`).
 */
export type VaultSymbol = "ayHBAR";

export type VaultConfig = {
  symbol: VaultSymbol;
  address: `0x${string}`;
  /** Vault share-token decimals. */
  decimals: number;
  /** Underlying asset deposited into the vault. */
  depositToken: string;
};

export const VAULTS: Record<VaultSymbol, VaultConfig> = {
  ayHBAR: {
    symbol: "ayHBAR",
    // Hedera mainnet (295). decimals() = 14 on-chain (HBARX 8 + 6 virtual
    // offset), asset() = HBARX — verified 2026-10-29. HBAR deposits are
    // staked to HBARX through Stader by the vault (lib/hbar/vault.ts).
    address: "0x33ad9057c2e17fa5b4abc119606c9cec97ed85db",
    decimals: 14,
    depositToken: "HBARX",
  },
};
