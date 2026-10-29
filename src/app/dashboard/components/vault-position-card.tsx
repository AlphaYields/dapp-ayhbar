'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { PortfolioChart } from '@/components/portfolio-chart';
import { DepositModal } from '@/components/deposit-modal';
import { RequestRedeemModal } from '@/components/request-redeem-modal';
import { RedeemModal } from '@/components/redeem-modal';
import { TokenId } from '@/types/static';
import { VAULT_MAP } from '@/lib/contracts';
import { useWithdrawalRequest } from '@/hooks/use-withdrawal-request';
import { TOKENS_OUT } from '@/data/tokens';
import { useVaults } from '@/hooks/use-vaults';
import { WithdrawalButton } from './withdrawal-button';

// .dc allocation rows use a single-hue green ramp (most→least weight)
const ALLOC_OPACITY = [1, 0.66, 0.44, 0.28];
const allocColor = (i: number) => `rgba(166, 237, 69, ${ALLOC_OPACITY[i] ?? 0.28})`;

// Portfolio Allocation paginates on the client; tweak to change rows shown per page.
const ALLOCATION_PER_PAGE = 10;

interface ChartDataPoint {
  date: string;
  timestamp: number;
  value: number;
}

interface VaultPositionCardProps {
  tokenId: TokenId;
  tokenLabel: string;
  icon: React.ReactNode;
  sharesValue: number;
  usdValue: number;
  pnl: string;
  chartData: ChartDataPoint[];
}

export function VaultPositionCard({
  tokenId,
  tokenLabel,
  icon,
  sharesValue,
  usdValue,
  pnl,
  chartData,
}: VaultPositionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const [chartPeriod, setChartPeriod] = useState<'1w' | '1m' | '3m' | 'all'>('1m');
  const [chartAnimate, setChartAnimate] = useState(true);
  const [allocPage, setAllocPage] = useState(1);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isRequestRedeemOpen, setIsRequestRedeemOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);

  const { address } = useAccount();
  const { request: withdrawalRequest, refetch: refetchWithdrawalRequest } = useWithdrawalRequest(
    tokenId,
    VAULT_MAP[tokenId],
    address
  );
  // The modals refresh their own reads, not this card's: re-read the request the
  // moment a withdraw/claim modal closes instead of waiting for the 30s poll.
  const closeWithdrawModal = (setOpen: (open: boolean) => void) => (open: boolean) => {
    setOpen(open);
    if (!open) refetchWithdrawalRequest();
  };
  const { data: vaults, isLoading: isVaultsLoading } = useVaults();
  const subVaults = vaults?.[tokenId]?.sub_vaults ?? null;

  function toggleExpand() {
    if (!isExpanded) {
      setVisible(true);
      setIsExpanded(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (panelRef.current) setPanelHeight(panelRef.current.scrollHeight);
        })
      );
      // Mount the chart only after the expand transition settles, so recharts plays its
      // left-to-right draw into a visible, fully-sized container (not a clipped/0-size one).
      if (!hasExpanded) setTimeout(() => setHasExpanded(true), 100);
    } else {
      setPanelHeight(0);
      setIsExpanded(false);
      setTimeout(() => setVisible(false), 300);
    }
  }

  // Allocation rows come from the vault's live sub_vaults.
  const allocation = (
    (subVaults ?? []).map((sv) => ({
      name: sv.token_name,
      pct: parseFloat(sv.weight) || 0,
      description: sv.description,
    }))
  ).map((item, i) => ({ ...item, color: allocColor(i) }));
  const tokenOut = TOKENS_OUT.find((t) => t.id === tokenId);
  const tokenName = tokenOut?.name ?? tokenId;
  const nativeSymbol = tokenOut?.nativeToken ?? '';

  const allocPages = Math.max(1, Math.ceil(allocation.length / ALLOCATION_PER_PAGE));
  const allocCur = Math.min(Math.max(1, allocPage), allocPages);
  const allocSlice = allocation.slice((allocCur - 1) * ALLOCATION_PER_PAGE, allocCur * ALLOCATION_PER_PAGE);

  // A page change adds/removes rows, so re-measure the (animated) panel to fit the new height.
  useEffect(() => {
    if (isExpanded && panelRef.current) setPanelHeight(panelRef.current.scrollHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocCur]);

  const filteredChartData = (() => {
    if (chartPeriod === 'all') return chartData;
    const cutoff = Date.now() - { '1w': 7, '1m': 30, '3m': 90 }[chartPeriod] * 864e5;
    return chartData.filter((d) => d.timestamp >= cutoff);
  })();

  const hasRequest = !!withdrawalRequest && withdrawalRequest.shares > BigInt(0);

  return (
    <>
      <div className={`pos-card ${isExpanded ? 'expanded' : ''}`}>
        {/* ── Header ── */}
        <div className="pos-card-header" onClick={toggleExpand}>
          <div className="pos-tok-row">
            <div className={`pos-tok-icon ${tokenId}`}>{icon}</div>
            <div>
              <div className="pos-amount">
                {sharesValue === 0 ? '0.0000' : sharesValue.toFixed(4)} {tokenName}
              </div>
              <div className="pos-amount-sub">
                ≈ {usdValue === 0 ? '0.00' : usdValue.toFixed(2)} {nativeSymbol}
              </div>
            </div>
          </div>

          <div className="pos-spacer" />

          <div className="pos-apy-wrap">
            <div className="pos-apy-lbl">Net PNL</div>
            <div className="pos-apy-val">{pnl}</div>
          </div>

          <span className="pos-toggle-label">{isExpanded ? 'Collapse' : 'Expand'}</span>

          <span className="pos-chevron" data-expanded={isExpanded || undefined}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>

        {/* ── Expandable body ── */}
        <div
          className="pos-card-body"
          style={{
            height: visible ? panelHeight + 'px' : '0px',
            opacity: visible && isExpanded ? 1 : 0,
            transition: isExpanded
              ? 'height 350ms ease-out, opacity 300ms ease-out'
              : 'height 260ms ease-in, opacity 200ms ease-in',
          }}
        >
          <div ref={panelRef} className="pos-body-inner">
            {/* Left: chart */}
            <div className="pos-chart-full">
              <div className="exp-pos-header">
                <div className="chart-period-row">
                  {(['1w', '1m', '3m', 'all'] as const).map((p) => (
                    <button
                      key={p}
                      className={`period-btn ${chartPeriod === p ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setChartAnimate(false);
                        setChartPeriod(p);
                      }}
                    >
                      {p === 'all' ? 'ALL' : p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pos-chart-canvas">
                {hasExpanded && (
                  <PortfolioChart
                    data={filteredChartData}
                    currentValue={usdValue}
                    showAxes={true}
                    animate={chartAnimate}
                  />
                )}
              </div>
            </div>

            {/* Right: actions + allocation */}
            <div className="pos-right-panel">
              <div className="action-row">
                <button
                  className="btn btn-green"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDepositOpen(true);
                  }}
                >
                  Deposit
                </button>
                <WithdrawalButton
                  hasRequest={hasRequest}
                  timelockEndsAt={withdrawalRequest?.timelockEndsAt ?? null}
                  pendingLabel={undefined}
                  totalSeconds={withdrawalRequest?.totalSeconds}
                  onRequestClick={() => setIsRequestRedeemOpen(true)}
                  onWithdrawClick={() => setIsRedeemOpen(true)}
                />
              </div>

              <div className="allocation-box">
                <div className="tok-rows-label">Portfolio Allocation</div>
                <div className="tok-rows">
                  {isVaultsLoading && allocation.length === 0 ? (
                    <div className="tok-row">
                      <span className="tok-name">Loading allocation…</span>
                    </div>
                  ) : allocation.length === 0 ? (
                    <div>
                      <span className="tok-name">No allocation data</span>
                    </div>
                  ) : (
                    allocSlice.map((item, i) => {
                      const { amount, description } = item as { amount?: string; description?: string };
                      return (
                        <div
                          key={`${item.name}-${(allocCur - 1) * ALLOCATION_PER_PAGE + i}`}
                          title={description || undefined}
                          className={`tok-row${amount ? ' tok-row-amount' : ''}`}
                        >
                          <div className="tok-dot" style={{ background: item.color }} />
                          <span className="tok-name">{item.name}</span>
                          {!amount && (
                            <div className="tok-bar-track">
                              <div className="tok-bar-fill" style={{ width: `${Math.max(0, item.pct)}%`, background: item.color }} />
                            </div>
                          )}
                          <span className="tok-pct">{amount ?? `${item.pct.toFixed(2)}%`}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {allocPages > 1 && (
                  <div className="alloc-pager">
                    <span className="scan-page-label">
                      Page {allocCur} / {allocPages}
                    </span>
                    <button
                      className="scan-pg-btn"
                      disabled={allocCur <= 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAllocPage((p) => Math.max(1, p - 1));
                      }}
                    >
                      ← Prev
                    </button>
                    <button
                      className="scan-pg-btn next"
                      disabled={allocCur >= allocPages}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAllocPage((p) => Math.min(allocPages, p + 1));
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DepositModal open={isDepositOpen} defaultToken={tokenId} onOpenChange={setIsDepositOpen} />
      {isRequestRedeemOpen && (
        <RequestRedeemModal
          open={isRequestRedeemOpen}
          defaultToken={tokenId}
          onOpenChange={closeWithdrawModal(setIsRequestRedeemOpen)}
        />
      )}
      {isRedeemOpen && (
        <RedeemModal open={isRedeemOpen} tokenId={tokenId} onOpenChange={closeWithdrawModal(setIsRedeemOpen)} />
      )}
    </>
  );
}
