'use client';

import { AYHBAR_VAULT, readHbarVault, type HbarVaultSnapshot } from '@/lib/hbar/vault';
import { getPublicClient } from '@/lib/viem-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Address } from 'viem';

/** Polled snapshot of the ayHBAR vault (+ the connected user's position/queue). `refetch` after every write. */
export function useHbarVault(user?: Address, pollMs = 15_000) {
  const cfg = AYHBAR_VAULT;
  const client = useMemo(() => getPublicClient(cfg.chain), [cfg]);
  const [data, setData] = useState<HbarVaultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setData(await readHbarVault(client, cfg, user));
    } catch (err) {
      console.error('[useHbarVault]', err);
    } finally {
      setLoading(false);
    }
  }, [client, cfg, user]);

  useEffect(() => {
    setLoading(true);
    refetch();
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [refetch, pollMs]);

  return { cfg, client, data, loading, refetch };
}
