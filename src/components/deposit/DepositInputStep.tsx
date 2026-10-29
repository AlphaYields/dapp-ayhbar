'use client';

import { TokenChainSelector } from '@/components/modals/token-selector';
import { VaultDropdown } from '@/components/modals/vault-dropdown';
import { TOKENS_OUT } from '@/data/tokens';
import { FALLBACK_DEPOSIT_TOKENS } from '@/lib/tokens';
import { VAULT_CHAIN_NAME } from '@/lib/vault-kind';
import { formatUsdApprox } from '@/hooks/use-token-prices';
import { CapacityCard } from './CapacityCard';

type TokenOut = (typeof TOKENS_OUT)[number];

export interface DepositableToken {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

interface ResumeFlow {
  phase: string;
}

interface DepositInputStepProps {
  isModal?: boolean;
  amount: string;
  onAmountChange: (val: string) => void;
  num: number;
  tokenOut: TokenOut;
  /** `depositAddress`: the token picked in that vault, carried across the switch. */
  setTokenOut: (t: TokenOut, depositAddress?: string) => void;
  depositableTokens: DepositableToken[];
  selectedDepositToken: DepositableToken | null;
  onSelectToken: (t: DepositableToken) => void;
  tokensLoading: boolean;
  isVaultPaused: boolean;
  isVaultFull: boolean;
  isUnderMaintenance?: boolean;
  isLoadingVaultStatus: boolean;
  statusLoaded: boolean;
  txError: string | null;
  /** USD value of `amount`; null = price unknown. */
  usdValue?: number | null;
  formattedBalance: string;
  previewShares: bigint | null;
  formatShares: (shares: bigint) => string;
  apyDisplay: string;
  apyByToken?: Record<string, number | undefined>;
  mounted: boolean;
  isConnected: boolean;
  onDepositClick: () => void;
  isButtonDisabled: boolean;
  buttonLabel: string;
  isButtonLoading: boolean;
  resumeFlow?: ResumeFlow | null;
  onResume: () => void;
  annualYield: string | null;
  sharePriceLabelText: string;
  remainingCapacity?: bigint | null;
  totalAssets?: bigint | null;
  capacityDecimals?: number;
  capacitySymbol?: string;
  walletAddress?: `0x${string}`;
  vaultKey?: string;
}

export function DepositInputStep({
  isModal,
  amount,
  onAmountChange,
  num,
  tokenOut,
  setTokenOut,
  depositableTokens,
  selectedDepositToken,
  onSelectToken,
  isVaultPaused,
  isVaultFull,
  isUnderMaintenance,
  isLoadingVaultStatus,
  statusLoaded,
  txError,
  usdValue = null,
  formattedBalance,
  previewShares,
  formatShares,
  apyDisplay,
  apyByToken,
  mounted,
  isConnected,
  onDepositClick,
  isButtonDisabled,
  buttonLabel,
  isButtonLoading,
  resumeFlow,
  onResume,
  annualYield,
  sharePriceLabelText,
  remainingCapacity,
  totalAssets,
  capacityDecimals = 6,
  capacitySymbol = '',
  walletAddress,
  vaultKey,
}: DepositInputStepProps) {
  // Picker rows: every token every vault accepts — the current vault's live list,
  // the others' static FALLBACK_DEPOSIT_TOKENS. Multi-token rows are
  // "<vaultId>:<address>", so picking another vault's token (e.g. avKAT from the
  // ayFLOW modal) switches vault and carries that token across.
  const multiToken = depositableTokens.length > 1;
  const tokenOptions = TOKENS_OUT.flatMap((out) => {
    const networks = [VAULT_CHAIN_NAME[out.id]];
    const tokens = out.id === tokenOut.id ? depositableTokens : (FALLBACK_DEPOSIT_TOKENS[out.id] ?? []);
    if (tokens.length <= 1) return [{ id: out.id, label: out.deposit, color: out.color, networks }];
    return tokens.map((t) => ({ id: `${out.id}:${t.address.toLowerCase()}`, label: t.symbol, color: out.color, networks }));
  });
  const selectedOptionId =
    multiToken && selectedDepositToken ? `${tokenOut.id}:${selectedDepositToken.address.toLowerCase()}` : tokenOut.id;
  const onPick = (id: string) => {
    const [vaultId, address] = id.split(':');
    if (vaultId !== tokenOut.id) {
      const out = TOKENS_OUT.find((t) => t.id === vaultId);
      if (out) setTokenOut(out, address);
      return;
    }
    const t = depositableTokens.find((d) => d.address.toLowerCase() === address);
    if (t) onSelectToken(t);
  };
  // Single-token vaults keep their display label (ayUSD shows "PYUSD", not the on-chain "PYUSD0").
  const depositSymbol = multiToken && selectedDepositToken ? selectedDepositToken.symbol : tokenOut.deposit.toUpperCase();

  const capacityLoading = isLoadingVaultStatus || !statusLoaded || remainingCapacity == null || totalAssets == null;
  const capacityCard = (
    <CapacityCard
      key={vaultKey ?? tokenOut.id}
      remainingCapacity={remainingCapacity}
      totalAssets={totalAssets}
      decimals={capacityDecimals}
      symbol={capacitySymbol}
      loading={capacityLoading}
    />
  );

  const resumeBanner = resumeFlow && (
    <div
      style={{
        borderRadius: 14,
        marginBottom: 12,
        background: 'rgba(166,237,69,0.07)',
        border: '1px solid rgba(166,237,69,0.2)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, color: '#A6ED45', fontWeight: 600 }}>
        {resumeFlow.phase === 'spoke_sent' && 'Pending cross-chain deposit detected'}
        {resumeFlow.phase === 'compose_found' && 'Pending compose message found on Flow EVM'}
        {resumeFlow.phase === 'hub_sent' && 'Pending hub deposit detected'}
      </div>
      <button
        onClick={onResume}
        style={{
          padding: '5px 14px',
          borderRadius: 86,
          border: 'none',
          background: '#A6ED45',
          color: '#121D30',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Resume
      </button>
    </div>
  );

  const inputPanels = (
    <>
      <div className="w-panel">
        <div className="w-panel-label">Deposit</div>
        <div className="w-input-row">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) onAmountChange(val);
            }}
            disabled={isVaultPaused || isVaultFull || isUnderMaintenance}
            placeholder="0"
            className="w-amount"
            style={{
              color: isVaultPaused || isVaultFull || isUnderMaintenance ? '#666' : '#FFFFFF',
              cursor: isVaultPaused || isVaultFull || isUnderMaintenance ? 'not-allowed' : 'text',
            }}
          />
          <TokenChainSelector options={tokenOptions} selectedId={selectedOptionId} onSelect={onPick} />
        </div>
        <div className="w-meta-row">
          <span>{formatUsdApprox(usdValue, num > 0)}</span>
          <span>
            Balance{' '}
            {mounted && isConnected
              ? parseFloat(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : '0'}{' '}
            {depositSymbol}
          </span>
        </div>
      </div>

      <div style={{ height: 6 }} />

      <div className="w-panel">
        <div className="w-panel-header">
          <div className="w-panel-label">Receive</div>
          <div className="apy-badge">
            <div className="apy-badge-dot" />
            <span>{apyDisplay}% APY</span>
          </div>
        </div>
        <div className="w-input-row">
          <span className="w-amount w-receive-amt" style={{ color: num > 0 ? '#A6ED45' : 'rgba(247,247,247,.35)' }}>
            {num > 0 ? (previewShares ? formatShares(previewShares) : '...') : '0'}
          </span>
          <VaultDropdown
            items={TOKENS_OUT}
            selected={tokenOut}
            onSelect={setTokenOut}
            renderItem={(t) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="w-sel-dot" style={{ background: t.color }} />
                <span>{t.name}</span>
              </span>
            )}
            renderRow={(t, active) => {
              const apy = apyByToken?.[t.id];
              return (
                <>
                  <span className="w-sel-dot" style={{ background: t.color }} />
                  <div className="flex flex-col">
                    <span className="rxd-name">{t.name}</span>
                    {apy != null && <span className="rxd-apy">{apy.toFixed(1)}% APY</span>}
                  </div>
                  {active && <span className="rx-check">✓</span>}
                </>
              );
            }}
          />
        </div>
      </div>
    </>
  );

  const errorBanner = (txError || isVaultPaused || isVaultFull || isUnderMaintenance) && (
    <div style={{ fontSize: 13, color: '#ff6b6b', textAlign: 'center', marginTop: 8 }}>
      {isUnderMaintenance
        ? 'Deposits are paused because the vault is under maintenance.'
        : isVaultPaused
          ? 'This vault is currently paused. Deposits are temporary disabled.'
          : isVaultFull
            ? 'This vault has reached its maximum capacity.'
            : txError}
    </div>
  );

  const depositButton = (
    <button
      onClick={onDepositClick}
      disabled={isButtonDisabled || isButtonLoading}
      className="btn btn-green"
      style={{
        width: '100%',
        justifyContent: 'center',
        padding: '14px 20px',
        fontSize: '14px',
        borderRadius: '11px',
        marginTop: isModal ? '12px' : '6px',
        opacity: isButtonDisabled || isButtonLoading ? 0.5 : 1,
        cursor: isButtonDisabled || isButtonLoading ? 'not-allowed' : 'pointer',
      }}
    >
      {isButtonLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#151617] border-t-transparent" />
          <span>Loading...</span>
        </div>
      ) : (
        buttonLabel
      )}
    </button>
  );

  if (isModal) {
    return (
      <>
        {resumeBanner}
        <div className="widget">{inputPanels}</div>
        <div className="dep-yield-est" style={{ opacity: num > 0 ? 1 : 0.45 }}>
          <div className="dep-ye-row">
            <span className="dep-ye-l">Estimated annual yield</span>
            <span className="dep-ye-v dep-ye-g">{annualYield ? `$${annualYield}` : '—'}</span>
          </div>
          <div className="dep-ye-row">
            <span className="dep-ye-l">Share price</span>
            <span className="dep-ye-v">{sharePriceLabelText}</span>
          </div>
        </div>
        {capacityCard}
        {depositButton}
        {errorBanner}
      </>
    );
  }

  return (
    <>
      <div className="widget">
        {resumeBanner}
        {inputPanels}
        {errorBanner}
        {depositButton}
      </div>
      {capacityCard}
    </>
  );
}
