'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserData } from '@/hooks/use-user-data';
import { useVaults } from '@/hooks/use-vaults';
import { usePnl } from '@/hooks/use-pnl';
import { useTokenPrices } from '@/hooks/use-token-prices';
import { TOKENS_OUT } from '@/data/tokens';
import { VAULT_MAP } from '@/lib/contracts';
import { TokenId } from '@/types/static';
import { VaultData } from '@/types/data';
import { useWalletReady } from '@/components/providers';
import { ModalKeyframes, PulseRing } from '@/components/modals/shared';
import { AyHbarLogo } from '@/app/aytokens/_components/TokenLogos';
import { SummaryBar, type SummaryPosition } from './components/summary-bar';
import { VaultPositionCard } from './components/vault-position-card';
import { StateNotConnected } from './components/state-not-connected';
import { StateNoPositions } from './components/state-no-positions';
import { FooterCompact } from '@/components/footer-compact';
import { findSharePriceAtBlock, findSharePriceAtUnixTime } from '@/utils/findSharePrice';

function parseUserValue(val: unknown): number {
  return val ? parseFloat(String(val)) : 0;
}

type DashState = 'loading' | 'not-connected' | 'no-positions' | 'has-positions';

type UserData = ReturnType<typeof useUserData>['data'];

const VAULT_ICON: Record<TokenId, React.ReactNode> = {
  [TokenId.AYHBAR]: <AyHbarLogo className="h-[30px] w-[30px]" />,
};

const toSharePriceChartData = (userData: UserData, vaultData: VaultData | undefined) => {
  if (!vaultData?.data?.length) return [];
  const firstBlock = userData?.user_general_info?.first_purchase_block ?? 0;
  return vaultData.data
    .filter((p) => p.block >= firstBlock)
    .map((p) => ({
      date: new Date(p.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: p.unix_time * 1000,
      value: p.share_price,
    }));
};

/** Yield (in the vault's native token) earned since `startTimeUnix`, net of deposits/withdrawals in the period. */
const calculateYield = (
  userData: UserData,
  vaultData: VaultData | undefined,
  currentShares: number,
  startTimeUnix: number
) => {
  if (!vaultData?.data?.length || currentShares === 0) return 0;

  const currentPrice = vaultData.last_share_price;
  const transactions = userData?.user_general_info?.transactions || [];
  const firstPurchaseUnix = userData?.user_general_info?.first_purchase_unixtime || 0;

  const actualStart = Math.max(startTimeUnix, firstPurchaseUnix);
  const startPrice = findSharePriceAtUnixTime(vaultData.data, actualStart);

  if (transactions.length === 0) {
    return currentShares * (currentPrice - startPrice);
  }

  let sharesAtStart = currentShares;
  let netInvestmentAssetDuringPeriod = 0;

  const sortedTx = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  for (const tx of sortedTx) {
    const txUnix = Math.floor(new Date(tx.timestamp).getTime() / 1000);
    const amount = parseUserValue(tx.amount);
    const type = (tx.type || tx.action || '').toLowerCase();
    const isDeposit =
      type.includes('deposit') || type.includes('mint') || type.includes('buy') || type.includes('transfer');
    const isWithdrawal = type.includes('withdraw') || type.includes('redeem') || type.includes('sell');

    if (txUnix >= actualStart) {
      if (isDeposit) {
        sharesAtStart -= amount;
        const priceAtTx = findSharePriceAtUnixTime(vaultData.data, txUnix);
        netInvestmentAssetDuringPeriod += amount * priceAtTx;
      } else if (isWithdrawal) {
        sharesAtStart += amount;
        const priceAtTx = findSharePriceAtUnixTime(vaultData.data, txUnix);
        netInvestmentAssetDuringPeriod -= amount * priceAtTx;
      }
    }
  }

  return currentShares * currentPrice - sharesAtStart * startPrice - netInvestmentAssetDuringPeriod;
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [dashState, setDashState] = useState<DashState>('loading');
  const [stateKey, setStateKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, isConnected } = useAccount();
  const walletReady = useWalletReady();

  const { data: vaults } = useVaults();
  const { usd } = useTokenPrices();
  const pnl = usePnl(address);
  // One query per vault.
  const userQueries: Record<TokenId, ReturnType<typeof useUserData>> = {
    [TokenId.AYHBAR]: useUserData(address, VAULT_MAP[TokenId.AYHBAR]),
  };

  const oneWeekAgoUnix = Math.floor(Date.now() / 1000) - 7 * 86400;

  // Everything the KPIs and cards need, per vault, in one place.
  const positions: SummaryPosition[] = TOKENS_OUT.map((t) => {
    const user = userQueries[t.id].data;
    const vault = vaults?.[t.id];
    const info = user?.user_general_info;
    const shares = parseUserValue(info?.tokens_amount);
    const native = parseUserValue(info?.tokens_amount_native);
    // Price natives with our live feed, backend tokens_amount_usd only while the
    // price is unknown.
    const usdValue = usd(t.nativeToken, native) ?? parseUserValue(info?.tokens_amount_usd);
    const totalYieldNative = calculateYield(user, vault, shares, 0);
    // pnl_percent_this_week is an amount in the vault's native token (legacy name), since Monday 00:00 UTC.
    const weekPnl = info?.pnl_percent_this_week;
    const weeklyYield =
      weekPnl != null
        ? parseUserValue(weekPnl)
        : calculateYield(user, vault, shares, oneWeekAgoUnix);
    const raw = pnl[t.id];
    return {
      id: t.id,
      name: t.name,
      nativeSymbol: t.nativeToken,
      shares,
      native,
      usd: usdValue,
      weeklyYield,
      totalYieldNative,
      totalYieldUsd: usd(t.nativeToken, totalYieldNative),
      pnlNative: raw.data?.pnl_denomination_token,
      pnlPct: raw.data?.pnl_pct,
      pnlLoading: raw.isLoading,
      chartData: toSharePriceChartData(user, vault),
    };
  });

  // Only the FIRST fetch per wallet counts as loading. react-query's isLoading is
  // true on every refetch while a query has no data (e.g. /api/userdata errors
  // for a vault the user never touched), and flipping dashState to 'loading'
  // remounts the whole tree (key={stateKey}) — which closes any open modal.
  const queries = Object.values(userQueries);
  const initialUserLoading = queries.some((q) => q.isLoading && !q.isFetched);
  const isDataLoading = !walletReady || (isConnected && initialUserLoading && queries.every((q) => !q.data));

  const open = positions.filter((p) => p.usd > 0);
  const hasAnyPosition = open.length > 0;

  useEffect(() => {
    if (!mounted) return;

    let next: DashState;
    if (!walletReady || isDataLoading) {
      next = 'loading';
    } else if (!isConnected) {
      next = 'not-connected';
    } else if (!hasAnyPosition) {
      next = 'no-positions';
    } else {
      next = 'has-positions';
    }

    if (next !== dashState) {
      setDashState(next);
      setStateKey((k) => k + 1);
    }
  }, [mounted, walletReady, isConnected, isDataLoading, hasAnyPosition]);

  if (!mounted) return null;

  return (
    <div key={stateKey} className="dash-page dash-fade-in flex flex-1 flex-col items-center justify-center">
      {dashState === 'loading' && (
        <div className="dash-loading">
          <ModalKeyframes />
          <PulseRing />
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Loading your portfolio…</p>
        </div>
      )}

      {dashState === 'not-connected' && <StateNotConnected />}

      {dashState === 'no-positions' && <StateNoPositions />}

      {dashState === 'has-positions' && (
        <div className="dash-content">
          <SummaryBar positions={positions} />

          <div className="sec-head">
            <div className="sec-title-dashboard">
              Open Positions <span>{open.length}</span>
            </div>
          </div>

          <div className="positions-list">
            {open.map((p) => (
              <VaultPositionCard
                key={p.id}
                tokenId={p.id}
                tokenLabel={p.name}
                icon={VAULT_ICON[p.id]}
                usdValue={p.native}
                pnl={p.pnlPct != null ? `${p.pnlPct.toFixed(1)}%` : '0%'}
                chartData={p.chartData}
                sharesValue={p.shares}
              />
            ))}
          </div>
        </div>
      )}

      <FooterCompact />
    </div>
  );
}
