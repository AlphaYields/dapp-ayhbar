import { createPublicClient, http, type Chain, type PublicClient } from 'viem'
import { hedera } from 'viem/chains'
import { CHAIN_RPC_URLS, HUB_CHAIN_ID } from '@/lib/constants'

export const publicClient = createPublicClient({
  chain: hedera,
  transport: http(CHAIN_RPC_URLS[HUB_CHAIN_ID]),
})

const clients = new Map<number, PublicClient>()

/** Cached read-only client per chain. */
export function getPublicClient(chain: Chain): PublicClient {
  let c = clients.get(chain.id)
  if (!c) {
    c = createPublicClient({ chain, transport: http(CHAIN_RPC_URLS[chain.id]) })
    clients.set(chain.id, c)
  }
  return c
}
