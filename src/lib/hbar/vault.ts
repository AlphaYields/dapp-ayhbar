/**
 * ayHBAR money path (Hedera, chain 295) — pure viem, no React.
 *
 * A port of the official SDK (github.com/AlphaYields/hbarx-vault, `sdk/src/vault.ts`,
 * ethers v6) to viem, trimmed to what the UI calls:
 *   - `readHbarVault`       vault state + the connected user's position
 *   - `previewHbarDeposit`  shares for an HBAR or HBARX amount
 *   - `hbarDeposit`         HBAR → `depositHBAR` (vault swaps to HBARX), or HBARX → approve → `deposit`
 *   - `hbarRequestWithdraw` / `hbarCancelRequest` / `hbarRedeem`  the two-step exit
 *   - `canReceiveHbarx`     mirror-node association check before a withdrawal
 *
 * Hedera quirks the SDK documents, all handled here:
 *   1. Writes are legacy (type 0) with an explicit gasPrice — the relay rejects
 *      EIP-1559 fields with a misleading "Insufficient funds" error.
 *   2. Gas limits are fixed, not estimated (the relay reserves gasLimit × gasPrice).
 *      The gas price is read from the relay per write: its minimum follows the
 *      HBAR/USD rate (fees are USD-pegged), so a hardcoded price goes stale.
 *   3. A reverted tx still returns a receipt — always check `status`.
 *   4. Never approve uint256 max — HTS rejects it. We approve the exact amount.
 *   5. HBARX must be associated to receive a withdrawal → `canReceiveHbarx`.
 *   6. An unfunded EVM address has no account; HBARX.balanceOf reverts → read as 0.
 *   7. The relay lags the mined nonce → pause between approve and deposit.
 *   8. `value` settles in tinybar (1e-8 HBAR) → round down to it.
 *
 * Withdrawals: `requestWithdraw(shares)` moves shares out of the wallet into the
 * queue (they keep earning); after `withdrawTimelock` they're claimed with
 * `redeem`. Adding to a request restarts the clock; `cancelWithdrawRequest`
 * returns the shares any time before the claim. Payout is always HBARX.
 */

import vaultConfig from '@/lib/config.json';
import { ERC20_ABI } from '@/lib/contracts';
import {
  BaseError,
  ContractFunctionRevertedError,
  parseAbi,
  parseEventLogs,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { hedera } from 'viem/chains';

export const HBAR_VAULT_ABI = parseAbi([
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewRedeem(uint256 shares) view returns (uint256)',
  'function maxDeposit(address) view returns (uint256)',
  'function maxRedeem(address) view returns (uint256)',
  'function withdrawTimelock() view returns (uint64)',
  'function paused() view returns (bool)',
  'function staking() view returns (address)',
  'function quoteWhbarToAsset(uint256 tinybar) view returns (uint256)',
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function depositHBAR(address receiver, uint256 minAssetsOut) payable returns (uint256)',
  'function requestWithdraw(uint256 shares)',
  'function cancelWithdrawRequest()',
  'function withdrawableAt(address owner) view returns (uint256 shares, uint64 unlockAt)',
  'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
  'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
  'event DepositedHBAR(address indexed caller, address indexed receiver, uint256 hbarIn, uint256 assets, uint256 shares)',
  'error NotAuthorized()',
  'error CapExceeded()',
  'error NoMaturedRequest()',
  'error TimelockNotElapsed()',
  'error InvalidParam()',
  'error EnforcedPause()',
]);

/** Stader, when the vault stakes instead of swapping (`staking() != 0`). */
const STAKING_ABI = parseAbi(['function getExchangeRate() view returns (uint256)']);

export interface HbarToken {
  /** Zero address = native HBAR. */
  address: Address;
  symbol: string;
  decimals: number;
}

export interface HbarVaultConfig {
  chain: typeof hedera;
  vault: Address;
  /** 14 = HBARX's 8 + a 6-decimal virtual offset. */
  shareDecimals: number;
  /** `vault.asset()` — HBARX. What the vault holds and pays out. */
  asset: HbarToken & { tokenId: string };
  /** What the deposit UI accepts, first = default. */
  depositTokens: HbarToken[];
}

const hbarx = vaultConfig.contracts.HBARX;
const ayHbar = vaultConfig.contracts.ayHBAR_VAULT;
const ZERO = BigInt(0);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const HBAR: HbarToken = { address: ZERO_ADDRESS, symbol: 'HBAR', decimals: 18 };
const HBARX: HbarVaultConfig['asset'] = {
  address: hbarx.address as Address,
  symbol: 'HBARX',
  decimals: hbarx.decimals,
  tokenId: hbarx.tokenId,
};

export const AYHBAR_VAULT: HbarVaultConfig = {
  chain: hedera,
  vault: ayHbar.address as Address,
  shareDecimals: ayHbar.decimals,
  asset: HBARX,
  depositTokens: [HBAR, HBARX],
};

const MIRROR_URL = 'https://mainnet.mirrornode.hedera.com';

/** Gas price when the relay won't quote: 140 tinybar/gas in weibar, above every minimum seen (SDK's `GAS_PRICE_FALLBACK_WEI`). Limits are from its `GAS` (measured on mainnet, with headroom). */
const FALLBACK_GAS_PRICE = BigInt(1_400_000_000_000);
const GAS_APPROVE = BigInt(900_000);
const GAS_DEPOSIT = BigInt(900_000);
const GAS_WITHDRAW = BigInt(900_000);
const SLIPPAGE_BPS = BigInt(100);
const TINYBAR = BigInt(10_000_000_000); // weibar per tinybar

export const isNativeHbar = (t: HbarToken) => t.address === ZERO_ADDRESS;

export interface HbarVaultSnapshot {
  totalAssets: bigint;
  totalSupply: bigint;
  maxDeposit: bigint;
  /** HBARX per 1 whole share (asset units). */
  assetsPerShare: bigint;
  /** Seconds between requestWithdraw and a claim. */
  withdrawTimelock: bigint;
  paused: boolean;
  user: {
    /** Shares in the wallet (queued shares are not included). */
    shares: bigint;
    /** Value of `shares` in HBARX. */
    assets: bigint;
    /** Wallet balance per `cfg.depositTokens` symbol (HBAR in weibar). */
    balances: Record<string, bigint>;
    queuedShares: bigint;
    /** Unix seconds from which the queued shares can be claimed. */
    unlockAt: bigint;
    /** Shares claimable this instant (timelock, pause and liquidity applied). */
    maxRedeem: bigint;
  } | null;
}

export async function readHbarVault(
  client: PublicClient,
  cfg: HbarVaultConfig,
  user?: Address
): Promise<HbarVaultSnapshot> {
  // ponytail: plain parallel reads, not multicall — HBARX.balanceOf reverts for an
  // unfunded address and the SDK reads one call at a time too.
  const v = { address: cfg.vault, abi: HBAR_VAULT_ABI } as const;
  const who = user ?? ZERO_ADDRESS;
  const oneShare = BigInt(10) ** BigInt(cfg.shareDecimals);
  const [totalAssets, totalSupply, maxDeposit, assetsPerShare, withdrawTimelock, paused] = await Promise.all([
    client.readContract({ ...v, functionName: 'totalAssets' }),
    client.readContract({ ...v, functionName: 'totalSupply' }),
    client.readContract({ ...v, functionName: 'maxDeposit', args: [who] }),
    client.readContract({ ...v, functionName: 'convertToAssets', args: [oneShare] }),
    client.readContract({ ...v, functionName: 'withdrawTimelock' }),
    client.readContract({ ...v, functionName: 'paused' }),
  ]);
  if (!user) return { totalAssets, totalSupply, maxDeposit, assetsPerShare, withdrawTimelock, paused, user: null };

  const [shares, [queuedShares, unlockAt], maxRedeem, hbarBalance, hbarxBalance] = await Promise.all([
    client.readContract({ ...v, functionName: 'balanceOf', args: [user] }),
    client.readContract({ ...v, functionName: 'withdrawableAt', args: [user] }),
    client.readContract({ ...v, functionName: 'maxRedeem', args: [user] }),
    client.getBalance({ address: user }),
    client
      .readContract({ address: cfg.asset.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [user] })
      .catch(() => ZERO), // no Hedera account yet — a state, not a fault
  ]);
  return {
    totalAssets,
    totalSupply,
    maxDeposit,
    assetsPerShare,
    withdrawTimelock,
    paused,
    user: {
      shares,
      assets: (shares * assetsPerShare) / oneShare,
      balances: { [HBAR.symbol]: hbarBalance, [cfg.asset.symbol]: hbarxBalance },
      queuedShares,
      unlockAt,
      maxRedeem,
    },
  };
}

/** HBARX the vault expects to get for `weibar` of HBAR, by whichever route it's configured for. */
async function quoteHbar(client: PublicClient, cfg: HbarVaultConfig, weibar: bigint) {
  const tinybar = weibar / TINYBAR;
  const staking = await client.readContract({ address: cfg.vault, abi: HBAR_VAULT_ABI, functionName: 'staking' });
  if (staking === ZERO_ADDRESS)
    return client.readContract({
      address: cfg.vault,
      abi: HBAR_VAULT_ABI,
      functionName: 'quoteWhbarToAsset',
      args: [tinybar],
    });
  const rate = await client.readContract({ address: staking, abi: STAKING_ABI, functionName: 'getExchangeRate' });
  return (tinybar * BigInt(100_000_000)) / rate;
}

/** Shares for depositing `amount` of `token` (HBAR is quoted to HBARX first). */
export async function previewHbarDeposit(client: PublicClient, cfg: HbarVaultConfig, token: HbarToken, amount: bigint) {
  const assets = isNativeHbar(token) ? await quoteHbar(client, cfg, amount) : amount;
  return client.readContract({
    address: cfg.vault,
    abi: HBAR_VAULT_ABI,
    functionName: 'previewDeposit',
    args: [assets],
  });
}

export function previewHbarRedeem(client: PublicClient, cfg: HbarVaultConfig, shares: bigint) {
  return client.readContract({
    address: cfg.vault,
    abi: HBAR_VAULT_ABI,
    functionName: 'previewRedeem',
    args: [shares],
  });
}

type Wallet = WalletClient & { account: NonNullable<WalletClient['account']> };

/** EIP-1193 4100: the wallet hasn't authorized this site/account for the method. */
const isUnauthorized = (err: unknown) =>
  /not been authorized/i.test(err instanceof Error ? err.message : String(err)) ||
  !!(err as Partial<BaseError> | null)?.walk?.((e) => (e as { code?: number } | null)?.code === 4100);

/**
 * HashPack's injected provider answers 4100 to `eth_sendTransaction` after a
 * silent reconnect (wagmi restores the session with `eth_accounts`, no
 * `eth_requestAccounts`). Ask for the account once — HashPack shows its connect
 * prompt — and resend.
 */
function requireAccount(walletClient: WalletClient): Wallet {
  if (!walletClient.account) throw new Error('Wallet has no account');
  const wc = walletClient as Wallet;
  const writeContract = (async (args: Parameters<Wallet['writeContract']>[0]) => {
    try {
      return await wc.writeContract(args);
    } catch (err) {
      if (!isUnauthorized(err)) throw err;
      await wc.requestAddresses();
      return wc.writeContract(args);
    }
  }) as Wallet['writeContract'];
  return { ...wc, writeContract };
}

/** Legacy tx fields priced off the relay's current minimum + 20% (the SDK's `gasPriceWei`). */
async function legacy(client: PublicClient, gas: bigint) {
  const relay = await client.getGasPrice().catch(() => ZERO);
  const gasPrice = relay > ZERO ? ((relay * BigInt(12)) / BigInt(10) / TINYBAR) * TINYBAR : FALLBACK_GAS_PRICE;
  return { type: 'legacy' as const, gasPrice, gas };
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function settle(client: PublicClient, hash: Hash, what: string) {
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`${what} transaction reverted — see ${hashscanTx(hash)}`);
  return receipt;
}

export const hashscanTx = (hash: string) => `https://hashscan.io/mainnet/transaction/${hash}`;

export type HbarDepositStep = 'approving' | 'depositing';

/** HBAR: one `depositHBAR` tx. HBARX: exact approve (if short) → `deposit`. */
export async function hbarDeposit(
  walletClient: WalletClient,
  client: PublicClient,
  cfg: HbarVaultConfig,
  token: HbarToken,
  amount: bigint,
  receiver: Address,
  onStep?: (step: HbarDepositStep) => void
): Promise<{ txHash: Hash; shares: bigint }> {
  const wc = requireAccount(walletClient);
  const base = { chain: cfg.chain, account: wc.account, address: cfg.vault, abi: HBAR_VAULT_ABI } as const;
  let txHash: Hash;

  if (isNativeHbar(token)) {
    const value = (amount / TINYBAR) * TINYBAR;
    const expected = await quoteHbar(client, cfg, value);
    const minAssetsOut = (expected * (BigInt(10_000) - SLIPPAGE_BPS)) / BigInt(10_000);
    onStep?.('depositing');
    txHash = await wc.writeContract({
      ...base,
      functionName: 'depositHBAR',
      args: [receiver, minAssetsOut],
      value,
      ...(await legacy(client, GAS_DEPOSIT)),
    });
  } else {
    onStep?.('approving');
    const owner = wc.account.address;
    const allowance = await client.readContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, cfg.vault],
    });
    if (allowance < amount) {
      const approveHash = await wc.writeContract({
        chain: cfg.chain,
        account: wc.account,
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [cfg.vault, amount],
        ...(await legacy(client, GAS_APPROVE)),
      });
      await settle(client, approveHash, 'Approval');
      await sleep(4000); // the relay lags the mined nonce
    }
    onStep?.('depositing');
    txHash = await wc.writeContract({
      ...base,
      functionName: 'deposit',
      args: [amount, receiver],
      ...(await legacy(client, GAS_DEPOSIT)),
    });
  }

  const receipt = await settle(client, txHash, 'Deposit');
  const [ev] = parseEventLogs({ abi: HBAR_VAULT_ABI, eventName: 'Deposit', logs: receipt.logs });
  return { txHash, shares: ev?.args.shares ?? ZERO };
}

/** Queue `shares` for withdrawal. Restarts the timelock on the whole queued amount. */
export async function hbarRequestWithdraw(
  walletClient: WalletClient,
  client: PublicClient,
  cfg: HbarVaultConfig,
  shares: bigint
) {
  const wc = requireAccount(walletClient);
  const txHash = await wc.writeContract({
    chain: cfg.chain,
    account: wc.account,
    address: cfg.vault,
    abi: HBAR_VAULT_ABI,
    functionName: 'requestWithdraw',
    args: [shares],
    ...(await legacy(client, GAS_WITHDRAW)),
  });
  await settle(client, txHash, 'Withdrawal request');
  return { txHash };
}

/** Return every queued share to the wallet. */
export async function hbarCancelRequest(walletClient: WalletClient, client: PublicClient, cfg: HbarVaultConfig) {
  const wc = requireAccount(walletClient);
  const txHash = await wc.writeContract({
    chain: cfg.chain,
    account: wc.account,
    address: cfg.vault,
    abi: HBAR_VAULT_ABI,
    functionName: 'cancelWithdrawRequest',
    ...(await legacy(client, GAS_WITHDRAW)),
  });
  await settle(client, txHash, 'Cancel');
  return { txHash };
}

/** Claim a matured request by share count. Pays HBARX to `receiver`. */
export async function hbarRedeem(
  walletClient: WalletClient,
  client: PublicClient,
  cfg: HbarVaultConfig,
  shares: bigint,
  receiver: Address
) {
  const wc = requireAccount(walletClient);
  const txHash = await wc.writeContract({
    chain: cfg.chain,
    account: wc.account,
    address: cfg.vault,
    abi: HBAR_VAULT_ABI,
    functionName: 'redeem',
    args: [shares, receiver, wc.account.address],
    ...(await legacy(client, GAS_WITHDRAW)),
  });
  const receipt = await settle(client, txHash, 'Withdrawal');
  const [ev] = parseEventLogs({ abi: HBAR_VAULT_ABI, eventName: 'Withdraw', logs: receipt.logs });
  return { txHash, assets: ev?.args.assets ?? ZERO };
}

/**
 * Whether `who` can receive HBARX (withdrawals pay in it). Hedera tokens must be
 * associated before they can be held; the mirror node answers for free.
 */
export async function canReceiveHbarx(cfg: HbarVaultConfig, who: Address): Promise<{ ok: boolean; reason: string }> {
  const res = await fetch(`${MIRROR_URL}/api/v1/accounts/${who}`);
  if (!res.ok) return { ok: false, reason: 'This address has no Hedera account yet — fund it with HBAR first.' };
  const acct = (await res.json()) as { max_automatic_token_associations?: number };
  const slots = acct.max_automatic_token_associations ?? 0;
  if (slots === -1) return { ok: true, reason: 'unlimited automatic association' };
  const rel = await fetch(`${MIRROR_URL}/api/v1/accounts/${who}/tokens?token.id=${cfg.asset.tokenId}`);
  const body = (await rel.json()) as { tokens?: unknown[] };
  if ((body.tokens ?? []).length > 0) return { ok: true, reason: 'HBARX already associated' };
  if (slots > 0) return { ok: true, reason: `${slots} automatic association slots free` };
  return {
    ok: false,
    reason: `Your wallet can't receive HBARX yet. Associate token ${cfg.asset.tokenId} (HBARX) in your Hedera wallet, then try again.`,
  };
}

/** Duck-typed (by name): wallet connectors can load a separate viem copy. */
function findRevert(err: unknown): Pick<ContractFunctionRevertedError, 'data'> | undefined {
  const base = err as Partial<BaseError> | null;
  if (typeof base?.walk !== 'function') return undefined;
  const revert = base.walk((e) => (e as { name?: string } | null)?.name === 'ContractFunctionRevertedError');
  return (revert as ContractFunctionRevertedError | null) ?? undefined;
}

/** Turn a viem/wallet error into one short line for the modal. */
export function hbarErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/user rejected|user denied/i.test(msg)) return 'Transaction rejected in wallet';
  if (/nonce too low|nonce is too low/i.test(msg))
    return 'Your wallet is out of sync with the network — wait a few seconds and try again';
  // A send the relay rejects (e.g. gas price under its minimum) still advances its
  // cached nonce, so the next send can fail with WRONG_NONCE once; a retry clears it.
  if (/WRONG_NONCE/i.test(msg)) return 'The Hedera relay is out of sync with your wallet — try again in a few seconds';
  if (/below configured minimum/i.test(msg))
    return 'The network gas price just rose above what was quoted — try again';
  if (/exceeds the balance|insufficient funds/i.test(msg)) return 'Insufficient HBAR for this amount plus gas fees';
  if (isUnauthorized(err))
    return "Your wallet hasn't authorized this site to send transactions — disconnect and reconnect it, then try again";
  const name = findRevert(err)?.data?.errorName;
  if (name === 'CapExceeded') return 'Amount exceeds the vault deposit cap';
  if (name === 'NoMaturedRequest') return 'Nothing queued — request a withdrawal first';
  if (name === 'TimelockNotElapsed') return 'Your withdrawal request has not unlocked yet';
  if (name === 'EnforcedPause') return 'The vault is paused — deposits and withdrawals are halted';
  if (name === 'InvalidParam')
    return 'Invalid amount (zero, or the HBAR → HBARX conversion moved past the 1% slippage limit)';
  if (name) return name;
  const base = err as Partial<BaseError> | null;
  return (typeof base?.shortMessage === 'string' ? base.shortMessage : msg).slice(0, 200);
}
