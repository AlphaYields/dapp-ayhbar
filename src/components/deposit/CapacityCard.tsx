'use client';

import { formatUnits } from 'viem';

const MAX_U256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

interface CapacityCardProps {
  remainingCapacity: bigint | null | undefined;
  totalAssets: bigint | null | undefined;
  decimals?: number;
  symbol?: string;
  loading?: boolean;
}

export function CapacityCard({
  remainingCapacity,
  totalAssets,
  decimals = 6,
  symbol = '',
  loading,
}: CapacityCardProps) {
  if (loading) {
    return (
      <div className="dep-cap-card">
        <div className="dep-cap-head">
          <span className="dep-cap-l">Remaining capacity</span>
          <span className="dep-cap-skel dep-cap-skel-sm" />
        </div>
        <div className="dep-cap-bar">
          <div className="dep-cap-fill dep-cap-skel-fill" />
        </div>
        <div className="dep-cap-meta">
          <span className="dep-cap-skel dep-cap-skel-md" />
          <span className="dep-cap-skel dep-cap-skel-md" />
        </div>
      </div>
    );
  }

  if (remainingCapacity == null || totalAssets == null) return null;
  if (remainingCapacity === MAX_U256) return null;
  const total = remainingCapacity + totalAssets;
  if (total === BigInt(0)) return null;

  const pct = Number((totalAssets * BigInt(10000)) / total) / 100;
  const fmt = (v: bigint) => {
    const n = parseFloat(formatUnits(v, decimals));
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="dep-cap-card">
      <div className="dep-cap-head">
        <span className="dep-cap-l">Remaining capacity</span>
        <span className="dep-cap-pct">
          {fmt(remainingCapacity)} {symbol}
        </span>
      </div>
      <div className="dep-cap-bar">
        <div className="dep-cap-fill" style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <div className="dep-cap-meta">
        <span>
          <b>
            {fmt(totalAssets)} {symbol}
          </b>{' '}
          deposited
        </span>
        <span>
          Cap{' '}
          <b>
            {fmt(total)} {symbol}
          </b>
        </span>
      </div>
    </div>
  );
}
