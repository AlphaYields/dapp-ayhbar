'use client';

import { VaultDropdown } from '@/components/modals/vault-dropdown';
import { TOKENS_OUT } from '@/data/tokens';
import { useVaults } from '@/hooks/use-vaults';
import { formatUsdApprox } from '@/hooks/use-token-prices';
import { TokenId } from '@/types/static';
import { formatUnits } from 'viem';

type TokenOut = (typeof TOKENS_OUT)[number];

interface RequestRedeemAmountStepProps {
  amount: string;
  onAmountChange: (val: string) => void;
  num: number;
  tokenOut: TokenOut;
  setTokenOut: (t: TokenOut) => void;
  receiveSymbol: string;
  receiveIcon: string;
  formattedBalance: string;
  balanceNumber: number;
  formattedReceive: string;
  sharePriceLabel: string;
  txError: string | null;
  /** USD value of `amount` (shares × share price × asset price); null = unknown. */
  usdValue?: number | null;
  mounted: boolean;
  isConnected: boolean;
  onSubmit: () => void;
  buttonLabel: string;
  isButtonDisabled: boolean;
  existingRequest: { shares: bigint; timelockEndsAt: bigint } | null;
  vaultDecimals: number;
  assetDecimals: number;
}

export function RequestRedeemAmountStep({
  amount,
  onAmountChange,
  num,
  tokenOut,
  setTokenOut,
  receiveSymbol,
  receiveIcon,
  formattedBalance,
  balanceNumber,
  formattedReceive,
  sharePriceLabel,
  txError,
  usdValue = null,
  mounted,
  isConnected,
  onSubmit,
  buttonLabel,
  isButtonDisabled,
  existingRequest,
  vaultDecimals,
  assetDecimals,
}: RequestRedeemAmountStepProps) {
  const { data: vaults } = useVaults();
  const hasAmt = num > 0;

  const hasPendingRequest = existingRequest && existingRequest.shares > BigInt(0);

  const getVaultApy = (tokenId: TokenId) => {
    if (!vaults) return '--';
    const vault = vaults[tokenId];
    return vault?.apy?.toFixed(1) || '--';
  };

  return (
    <>
      {hasPendingRequest && (
        <div className="wd-pending-banner">
          <div>
            Pending request: {parseFloat(formatUnits(existingRequest.shares, vaultDecimals)).toFixed(4)} {tokenOut.name}
          </div>
          {existingRequest.timelockEndsAt > BigInt(0) && (
            <div className="wd-pending-banner-sub">
              Unlocks: {new Date(Number(existingRequest.timelockEndsAt) * 1000).toLocaleString()}
            </div>
          )}
        </div>
      )}

      <div className="widget">
        <div className="w-panel">
          <div className="w-panel-label">Withdraw</div>
          <div className="w-input-row">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) onAmountChange(val);
              }}
              placeholder="0"
              className="w-amount"
              disabled={hasPendingRequest || false}
            />
            <VaultDropdown
              items={TOKENS_OUT.map((i) => ({ ...i, description: `${getVaultApy(i.id)}% APY` }))}
              selected={tokenOut}
              onSelect={setTokenOut}
              renderItem={(t) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={t.icon} alt={t.name} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                  <span>{t.name}</span>

                  <div className="wd-apy-badge">
                    <span>{getVaultApy(t.id)}% APY</span>
                  </div>
                </div>
              )}
            />
          </div>
          <div className="w-meta-row">
            <span>{formatUsdApprox(usdValue, hasAmt)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span>
                Balance:{' '}
                {mounted && isConnected ? balanceNumber.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
              </span>
              {mounted && isConnected && balanceNumber > 0 && !hasPendingRequest && (
                <span
                  onClick={() => onAmountChange(formattedBalance)}
                  style={{ cursor: 'pointer', color: 'var(--green)', fontWeight: 600 }}
                >
                  MAX
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-divider">
          <div className="w-arrow-btn">↓</div>
        </div>

        <div className="wd-rx-panel">
          <div className="w-panel-header">
            <div className="w-panel-label">Receive</div>
          </div>
          <div className="wd-rx-row">
            <span className="wd-rx-amt" style={{ color: hasAmt ? 'rgba(247,247,247,.85)' : 'rgba(247,247,247,.35)' }}>
              {hasAmt ? formattedReceive : '0'}
            </span>
            <div className="w-token-sel" style={{ cursor: 'default' }}>
              <img src={receiveIcon} alt={receiveSymbol} style={{ width: 16, height: 16, borderRadius: '50%' }} />
              <span>{receiveSymbol}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wd-metrics-card" style={{ opacity: hasAmt ? 1 : 0.45 }}>
        <div className="wd-mc-row">
          <span className="wd-mc-l">Estimated receive amount</span>
          <span className="wd-mc-v g">{hasAmt ? `${formattedReceive} ${receiveSymbol}` : '—'}</span>
        </div>
        <div className="wd-mc-row">
          <span className="wd-mc-l">Share price</span>
          <span className="wd-mc-v">{sharePriceLabel}</span>
        </div>
      </div>

      {txError && <div className="wd-error">{txError}</div>}

      <button
        onClick={onSubmit}
        disabled={isButtonDisabled || hasPendingRequest || false}
        className="btn btn-green"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '12px',
          fontSize: '14px',
          borderRadius: '8px',
          marginTop: '12px',
          opacity: isButtonDisabled ? 0.5 : 1,
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {buttonLabel}
      </button>
    </>
  );
}
