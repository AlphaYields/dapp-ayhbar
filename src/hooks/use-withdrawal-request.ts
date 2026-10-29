'use client';

import { AYHBAR_VAULT, readHbarVault } from '@/lib/hbar/vault';
import { getPublicClient } from '@/lib/viem-client';
import { TokenId } from '@/types/static';
import { useEffect, useState, useCallback } from 'react';
import type { Address } from 'viem';

/**
 * Normalised "do I have an open withdrawal request" shape for the dashboard.
 * `timelockEndsAt === 0n` means claimable now.
 *
 * ayHBAR: `withdrawableAt(user)`. Unlocked → 0n, otherwise `unlockAt`.
 */
export type WithdrawalRequest = {
  shares: bigint;
  timelockEndsAt: bigint;
  /** Full length of the wait the countdown is measuring (drives the progress bar). */
  totalSeconds?: number;
} | null;

export function useWithdrawalRequest(tokenId: TokenId, vault: Address | undefined, owner: Address | undefined, pollMs = 30_000) {
  const [request, setRequest] = useState<WithdrawalRequest>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!vault || !owner) {
      setRequest(null);
      setLoading(false);
      return;
    }
    try {
      const snap = await readHbarVault(getPublicClient(AYHBAR_VAULT.chain), AYHBAR_VAULT, owner);
      const u = snap.user;
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (!u || u.queuedShares === BigInt(0)) setRequest(null);
      else
        setRequest({
          shares: u.queuedShares,
          timelockEndsAt: u.unlockAt <= now ? BigInt(0) : u.unlockAt,
          totalSeconds: Number(snap.withdrawTimelock),
        });
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [vault, owner]);

  useEffect(() => {
    setLoading(true);
    refetch();
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [refetch, pollMs]);

  return { request, loading, refetch };
}
