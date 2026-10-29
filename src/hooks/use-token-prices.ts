'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * USD prices by token symbol from /api/prices (CoinGecko, cached 60s).
 * `usd(symbol, amount)` → USD value, or `null` while the price is unknown so
 * the UI can show "—" instead of a wrong number.
 */
export function useTokenPrices() {
  const query = useQuery<Record<string, number>>({
    queryKey: ['token-prices'],
    queryFn: async () => {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error('prices fetch failed');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
  const prices = query.data;
  const usd = useCallback(
    (symbol: string | undefined, amount: number): number | null => {
      const p = symbol ? prices?.[symbol] : undefined;
      return p == null ? null : amount * p;
    },
    [prices]
  );
  return { prices, usd, isLoading: query.isLoading };
}

/** "≈ $12.34", "≈ <$0.01", or "≈ —" when the price is unknown. `$0` for no amount. */
export function formatUsdApprox(value: number | null, hasAmount: boolean): string {
  if (!hasAmount) return '$0';
  if (value == null) return '≈ —';
  if (value > 0 && value < 0.01) return '≈ <$0.01';
  return `≈ $${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
