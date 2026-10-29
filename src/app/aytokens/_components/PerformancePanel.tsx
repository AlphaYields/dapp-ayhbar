'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ChartFrame, TokenContent } from '@/app/data/tokenContent';
import { buildPanelChart, buildPanelChartFromHistory, historyXLabels, sliceHistory } from './chart';
import { useVaultLive, fmtUsdM, fmtNativeM, type LiveVault } from './useVaultLive';

/** Override a frame's seed APY with the matching live field when present. */
function frameApy(frame: ChartFrame, live: LiveVault): string {
  if (!frame.live) return frame.apy;
  const v = live[frame.live];
  return typeof v === 'number' ? `${v.toFixed(1)}%` : frame.apy;
}

const tabCls = (on: boolean) =>
  cn(
    'cursor-pointer rounded-[7px] border-none px-[14px] py-[7px] font-mono text-[12px] font-semibold tracking-[0.04em] transition-colors',
    on ? 'bg-brand/[0.14] text-brand' : 'bg-transparent text-foreground/50 hover:text-foreground/80'
  );

/**
 * Share-price performance panel: timeframe-toggled headline APY + a synthetic
 * share-price curve (marketing visual). APY and since-inception go live via
 * `useVaultLive`; TVL stays seeded (no API field). The chart is deterministic.
 */
export function PerformancePanel({ token }: { token: TokenContent }) {
  const live = useVaultLive(token.address);
  const [tf, setTf] = useState<ChartFrame['key']>('1M');
  const frame = token.perf.frames.find((f) => f.key === tf) ?? token.perf.frames[1];
  // Plot the real historical_data series for this timeframe; fall back to the
  // design's synthetic curve only when the API returns no usable history.
  const history = sliceHistory(live?.data ?? [], frame.key);
  const hasHistory = history.length >= 2;
  const chart = hasHistory ? buildPanelChartFromHistory(history) : buildPanelChart(frame);
  // Axis labels must describe the plotted window, not the design's fixed months.
  const xLabels = hasHistory ? historyXLabels(history, frame.xs.length) : frame.xs;
  const sinceInception =
    typeof live.pnl_since_inception === 'number'
      ? `+${live.pnl_since_inception.toFixed(1)}% since inception`
      : token.perf.sinceInception;
  // Native-token symbol is the trailing word of the seed sub-label (WFLOW/PYUSD).
  const nativeSym = token.perf.tvlSub.split(' ').pop() ?? token.unit;
  const tvl = typeof live.nav_usd === 'number' ? fmtUsdM(live.nav_usd) : token.perf.tvl;
  const tvlSub =
    typeof live.nav_denomination_token === 'number'
      ? fmtNativeM(live.nav_denomination_token, nativeSym)
      : token.perf.tvlSub;

  return (
    <section className="mx-auto max-w-[1240px] px-6 pb-[88px] sm:px-10">
      <div className="rounded-[20px] border border-white/[0.08] bg-surface px-[34px] pb-[38px] pt-8">
        <div className="mb-[34px] flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="mb-[10px] font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-foreground/[0.42]">
              {frame.label}
            </div>
            <div className="font-display text-[58px] font-extrabold leading-[0.85] text-brand">
              {frameApy(frame, live)}
            </div>
          </div>
          <div className="flex gap-1 self-center rounded-[10px] border border-white/[0.07] bg-white/[0.04] p-1">
            {token.perf.frames.map((f) => (
              <button key={f.key} type="button" onClick={() => setTf(f.key)} className={tabCls(tf === f.key)}>
                {f.key}
              </button>
            ))}
          </div>
          <div className="text-right">
            <div className="mb-[10px] font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-foreground/[0.42]">
              TVL
            </div>
            <div className="font-display text-[58px] font-extrabold leading-[0.85]">{tvl}</div>
            <div className="mt-[9px] font-mono text-[11.5px] text-foreground/40">{tvlSub}</div>
            <div className="mt-1 font-mono text-[11.5px] text-brand">{sinceInception}</div>
          </div>
        </div>

        <div className="mb-[14px] font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-foreground/[0.42]">
          Share price
        </div>
        <div className="flex gap-[14px]">
          <div className="flex h-[300px] flex-col justify-between py-[2px]">
            {chart.yLabels.map((y, i) => (
              <span key={`${y}-${i}`} className="whitespace-nowrap font-mono text-[11px] text-foreground/35">
                {y}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="block h-[300px] w-full overflow-visible">
              {[0.5, 75, 150, 225, 299.5].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path d={chart.area} fill="rgba(166,237,69,0.08)" />
              <path
                d={chart.line}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="mt-3 flex justify-between">
              {xLabels.map((x, i) => (
                <span key={`${x}-${i}`} className="whitespace-nowrap font-mono text-[11px] text-foreground/35">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
