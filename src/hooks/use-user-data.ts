import { useQuery } from '@tanstack/react-query'
import { HttpError, retryOn5xx } from '@/lib/query-retry'

interface UserData {
  address?: string
  total_deposits?: number
  total_withdrawals?: number
  current_balance?: number
  first_deposit_date?: string
  last_activity_date?: string
  transaction_count?: number
  user_general_info: {
    tokens_amount: number
    tokens_amount_native: number
    tokens_amount_usd: number
    /** avKAT vault only: position converted to KAT at the on-chain avKAT→KAT rate. Null elsewhere. */
    tokens_amount_kat?: number | null
    /** Wallet P&L since Monday 00:00 UTC, as an AMOUNT in the vault's native token (legacy name, not a %). */
    pnl_percent_this_week?: number | null
    first_purchase_block: number
    first_purchase_unixtime: number
    first_purchase_time: string
    transactions?: {
      timestamp: string
      amount: string | number
      type?: string
      action?: string
      transaction_hash: string
      user?: string
    }[]
  }
  user_historical_data: {
    block: number
    unix_time: number
    time: string
    pnl_percent: string
    tokens_amount?: string | number
  }[]
  [key: string]: any
}

export function useUserData(address: string | undefined, vaultAddress?: string) {
  return useQuery<UserData>({
    queryKey: ['userData', address, vaultAddress],
    queryFn: async () => {
      if (!address) {
        throw new Error('Address is required')
      }

      const params = new URLSearchParams({ address })
      if (vaultAddress) params.set('vaultAddress', vaultAddress)

      const response = await fetch(`/api/userdata?${params}`)

      if (!response.ok) {
        throw new HttpError(response.status, 'Failed to fetch user data')
      }

      return response.json()
    },
    enabled: !!address && !!vaultAddress,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: retryOn5xx(1),
  })
}
