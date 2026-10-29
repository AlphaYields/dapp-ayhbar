import { useQuery } from '@tanstack/react-query';
import { VaultData } from '@/types/data';
import { VAULT_MAP } from '@/lib/contracts';
import { TokenId } from '@/types/static';

export interface UseVaultsOutput {
  [TokenId.AYHBAR]: VaultData;
}

export function useVaults() {
  const vaults = VAULT_MAP;
  return useQuery<UseVaultsOutput>({
    queryKey: ['vaults'],
    retry: 1,
    refetchInterval: 60000,
    staleTime: 30000,
    queryFn: async () => {
      const [...responses] = await Promise.allSettled(
        Object.values(vaults).map((vaultAddress) => fetch(`/api/vaultdata_v2?vaultAddress=${vaultAddress}`))
      );
      const tokenOutToVaultDataMap: Partial<Record<TokenId, VaultData>> = {};

      for (const [index, response] of responses.entries()) {
        if (response.status === 'fulfilled') {
          const responseJson = await response.value.json();
          if (responseJson.error) {
            console.error('Failed to fetch vault data', responseJson.error);
            continue;
          }

          tokenOutToVaultDataMap[Object.keys(vaults)[index] as TokenId] = responseJson;
        }
      }
      return tokenOutToVaultDataMap as UseVaultsOutput;
    },
  });
}
