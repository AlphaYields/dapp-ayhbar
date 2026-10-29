'use client';

import type { TokenId } from '@/types/static';

/** Per-vault figures the dashboard derives once and shares with the KPI bar and cards. */
export interface SummaryPosition {
  id: TokenId;
  name: string;
  nativeSymbol: string;
  shares: number;
  /** Position size in the vault's native token. */
  native: number;
  /** Position size in USD (native × live price). */
  usd: number;
  /** P&L this week (since Monday 00:00 UTC), native units. */
  weeklyYield: number;
  /** Yield since first deposit, native units. */
  totalYieldNative: number;
  /** `totalYieldNative` in USD; null while the price is unknown. */
  totalYieldUsd: number | null;
  /** Accounting API PnL, native units / percent. */
  pnlNative?: number;
  pnlPct?: number;
  pnlLoading?: boolean;
  chartData: { date: string; timestamp: number; value: number }[];
}

function fmtNative(val: number, decimals = 4): string {
  if (val === 0) return '0';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}`;
}

const fmtUsd = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function SummaryBar({ positions }: { positions: SummaryPosition[] }) {
  const open = positions.filter((p) => p.usd > 0);
  const portfolioUsd = open.reduce((sum, p) => sum + p.usd, 0);

  const pcts = open.filter((p) => p.pnlPct != null).map((p) => p.pnlPct as number);
  const blendedPnl = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;

  const totalYieldUsd = open.reduce((sum, p) => sum + (p.totalYieldUsd ?? 0), 0);
  const withTotal = open.filter((p) => (p.pnlNative ?? 0) >= 0.01);
  const pnlLoading = open.some((p) => p.pnlLoading);
  const skeleton = <div className="tx-skeleton" style={{ height: 14, width: '60%' }} />;

  return (
    <div className="dash-summary-bar">
      <div className="dash-sc accent">
        <div className="dash-sc-label">Portfolio Value</div>
        <div className="dash-sc-val">{fmtUsd(portfolioUsd)}</div>
        <div className="dash-sc-change" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {open.map((p, i) => (
            <span key={p.id}>
              {fmtNative(p.weeklyYield, 2)} {p.nativeSymbol}
              {i === open.length - 1 && <span style={{ color: 'var(--muted)' }}> this week</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="dash-sc">
        <div className="dash-sc-label">Total Yield Earned</div>
        <div className="dash-sc-val">{pnlLoading ? skeleton : totalYieldUsd > 0 ? fmtUsd(totalYieldUsd) : '—'}</div>
        <div className="dash-sc-change" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {open.map((p) =>
            p.pnlLoading ? (
              <span key={p.id}>{skeleton}</span>
            ) : (p.pnlNative ?? 0) >= 0.01 ? (
              <span key={p.id}>
                {fmtNative(p.pnlNative ?? 0)} {p.nativeSymbol}
              </span>
            ) : null
          )}
          {!pnlLoading && withTotal.length === 0 && <span style={{ color: 'var(--muted)' }}>Since first deposit</span>}
        </div>
      </div>

      <div className="dash-sc">
        <div className="dash-sc-label">Blended PnL</div>
        <div className="dash-sc-val green">{pnlLoading ? skeleton : `${blendedPnl.toFixed(1)}%`}</div>
        <div className="dash-sc-change" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="apy-pulse-dot" />
          Live
        </div>
      </div>
    </div>
  );
}
