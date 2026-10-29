import { useQueries } from '@tanstack/react-query';
import { AccountingAPIResponse } from '@/types/data';
import { VAULT_MAP } from '@/lib/contracts';
import { TokenId } from '@/types/static';
import { HttpError, retryOn5xx } from '@/lib/query-retry';

export interface PnlResult {
  [TokenId.AYHBAR]: { data: AccountingAPIResponse | undefined; isLoading: boolean };
}

async function fetchPnl(vaultAddress: string, walletAddress: string): Promise<AccountingAPIResponse> {
  const res = await fetch(`/api/accounting-pnl?vaultAddress=${vaultAddress}&walletAddress=${walletAddress}`);
  if (!res.ok) throw new HttpError(res.status, 'pnl fetch failed');
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  return (json ?? {}) as AccountingAPIResponse;
}

export function usePnl(walletAddress: `0x${string}` | undefined): PnlResult {
  const tokenIds = Object.keys(VAULT_MAP) as TokenId[];

  const queries = useQueries({
    queries: tokenIds.map((tokenId) => ({
      queryKey: ['accounting-pnl', VAULT_MAP[tokenId], walletAddress],
      queryFn: () => fetchPnl(VAULT_MAP[tokenId], walletAddress as string),
      enabled: !!walletAddress,
      retry: retryOn5xx(1),
      refetchInterval: 60000,
      staleTime: 30000,
    })),
  });

  const result = {} as PnlResult;
  tokenIds.forEach((tokenId, i) => {
    result[tokenId] = { data: queries[i].data, isLoading: queries[i].isLoading };
  });
  return result;
}
